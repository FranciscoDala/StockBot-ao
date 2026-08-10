from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from typing import List, cast
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.venda import Venda
from app.models.movimentacao_venda import MovimentoVenda
from app.models.usuario import Usuario
from app.schemas.cliente import ClienteCreate, ClienteOut
from app.core.deps import get_current_user

router = APIRouter()

class PagamentoCreate(BaseModel):
    valor: float
    forma_pagamento: str
    observacao: str | None = None

async def _cliente_to_out(db: AsyncSession, cliente: Cliente) -> ClienteOut:
    # total_divida = Soma do que falta pagar de todas vendas em aberto
    stmt = select(func.coalesce(func.sum(Venda.total - Venda.valor_recebido), 0)).where(
        Venda.cliente_id == cliente.id,
        Venda.status.in_(["divida", "parcial"])
    )
    result = await db.execute(stmt)
    total_divida = result.scalar() or 0.0

    # ultima_venda
    stmt = select(Venda).where(Venda.cliente_id == cliente.id).order_by(Venda.created_at.desc())
    result = await db.execute(stmt)
    ultima_venda = result.scalars().first()

    ultima_compra: datetime = cast(datetime, ultima_venda.created_at) if ultima_venda else cast(datetime, cliente.created_at)
    status_cliente = "com_divida" if total_divida > 0 else "em_dia"

    return ClienteOut(
        id=getattr(cliente, "id"),
        loja_id=getattr(cliente, "loja_id"),
        nome=getattr(cliente, "nome"),
        nome_empresa=getattr(cliente, "nome_empresa"),
        bi=getattr(cliente, "bi"),
        telefone=getattr(cliente, "telefone"),
        email=getattr(cliente, "email"),
        endereco=getattr(cliente, "endereco"),
        cidade=getattr(cliente, "cidade"),
        provincia=getattr(cliente, "provincia"),
        observacoes=getattr(cliente, "observacoes"),
        is_active=getattr(cliente, "is_active"),
        created_at=getattr(cliente, "created_at"),
        total_divida=float(total_divida),
        ultima_compra=ultima_compra,
        status=status_cliente
    )

@router.get("/{loja_id}/clientes", response_model=List[ClienteOut])
async def listar_clientes(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.is_active == True)
    result = await db.execute(stmt)
    clientes = result.scalars().all()
    return [await _cliente_to_out(db, c) for c in clientes]

@router.post("/{loja_id}/clientes", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
async def criar_cliente(
    loja_id: UUID,
    cliente_in: ClienteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if cliente_in.bi:
        stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.bi == cliente_in.bi)
        result = await db.execute(stmt)
        existe = result.scalars().first()
        if existe:
            raise HTTPException(status_code=400, detail="BI já cadastrado para esta loja")

    data = cliente_in.model_dump()
    data["loja_id"] = loja_id
    db_cliente = Cliente(**data)

    db.add(db_cliente)
    await db.commit()
    await db.refresh(db_cliente)
    return await _cliente_to_out(db, db_cliente)

@router.get("/{loja_id}/clientes/{cliente_id}/pendentes")
async def listar_pendencias_cliente(
    loja_id: UUID,
    cliente_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Pega todas vendas em aberto: divida ou parcial
    stmt = select(Venda).where(
        Venda.loja_id == loja_id,
        Venda.cliente_id == cliente_id,
        Venda.status.in_(["divida", "parcial"])
    ).order_by(Venda.created_at.desc())
    result = await db.execute(stmt)
    vendas = result.scalars().all()

    return [{
        "id": str(v.id),
        "data_venda": v.created_at,
        "total": float(v.total),
        "valor_recebido": float(v.valor_recebido),
        "saldo_devedor": float(v.total - v.valor_recebido),
        "status": v.status,
        "total_itens": v.total_itens
    } for v in vendas]

@router.post("/{loja_id}/clientes/{cliente_id}/receber-parcela")
async def receber_parcela(
    loja_id: UUID,
    cliente_id: UUID,
    pagamento: PagamentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """ROTA ANTIGA: Abate na dívida mais antiga. Mantida pra compatibilidade"""
    if pagamento.valor <= 0:
        raise HTTPException(400, "Valor do pagamento deve ser maior que zero")

    stmt = select(Venda).where(
        Venda.loja_id == loja_id,
        Venda.cliente_id == cliente_id,
        Venda.status.in_(["divida", "parcial"])
    ).order_by(Venda.created_at)
    result = await db.execute(stmt)
    dividas = result.scalars().all()

    if not dividas:
        raise HTTPException(status_code=404, detail="Cliente não possui dívidas")

    valor_restante = float(pagamento.valor)
    total_pago = 0.0

    for venda in dividas:
        if valor_restante <= 0:
            break

        divida_atual = float(venda.total) - float(venda.valor_recebido)
        if divida_atual <= 0:
            continue

        valor_a_pagar = min(valor_restante, divida_atual)

        movimento = MovimentoVenda(
            venda_id=venda.id,
            loja_id=loja_id,
            cliente_id=cliente_id,
            usuario_id=current_user.id,
            valor_pago=valor_a_pagar,
            forma_pagamento=pagamento.forma_pagamento,
            observacao=pagamento.observacao
        )
        db.add(movimento)

        venda.valor_recebido = float(venda.valor_recebido) + valor_a_pagar

        if float(venda.valor_recebido) >= float(venda.total):
            venda.status = "concluida"
        else:
            venda.status = "parcial"

        valor_restante -= valor_a_pagar
        total_pago += valor_a_pagar

    await db.commit()
    return {"detail": f"Pagamento de {total_pago:.2f} KZ registrado com sucesso"}

@router.post("/{loja_id}/clientes/{cliente_id}/vendas/{venda_id}/pagar")
async def pagar_venda_especifica(
    loja_id: UUID,
    cliente_id: UUID,
    venda_id: UUID,
    pagamento: PagamentoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """ROTA NOVA: Paga 1 dívida específica selecionada pelo usuário"""
    if pagamento.valor <= 0:
        raise HTTPException(400, "Valor do pagamento deve ser maior que zero")

    # Busca a venda específica
    stmt = select(Venda).where(
        Venda.id == venda_id,
        Venda.loja_id == loja_id,
        Venda.cliente_id == cliente_id,
        Venda.status.in_(["divida", "parcial"])
    )
    result = await db.execute(stmt)
    venda = result.scalar_one_or_none()

    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada ou já paga")

    divida_atual = float(venda.total) - float(venda.valor_recebido)
    if divida_atual <= 0:
        raise HTTPException(status_code=400, detail="Esta venda já está paga")

    valor_a_pagar = min(float(pagamento.valor), divida_atual)

    # 1. Cria movimento/histórico
    movimento = MovimentoVenda(
        venda_id=venda.id,
        loja_id=loja_id,
        cliente_id=cliente_id,
        usuario_id=current_user.id,
        valor_pago=valor_a_pagar,
        forma_pagamento=pagamento.forma_pagamento,
        observacao=pagamento.observacao
    )
    db.add(movimento)

    # 2. Atualiza venda
    venda.valor_recebido = float(venda.valor_recebido) + valor_a_pagar

    if float(venda.valor_recebido) >= float(venda.total):
        venda.status = "concluida"
    else:
        venda.status = "parcial"

    await db.commit()
    return {"detail": f"Pagamento de {valor_a_pagar:.2f} KZ registrado para a venda {str(venda_id)[:8]}"}
