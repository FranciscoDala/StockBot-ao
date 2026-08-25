import logging
from decimal import Decimal
from datetime import datetime, date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, update, delete, and_, or_
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.venda import Venda
from app.models.movimentacao_venda import MovimentoVenda
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from app.models.role import UserRole
from app.models.produto import Produto
from app.models.caixa import Caixa, StatusCaixa
from app.models.movimentacao_caixa import TipoMovimentacao
from app.schemas.cliente import ClienteCreate, ClienteOut
from app.core.deps import get_current_user, verificar_acesso_loja
from app.core.security import verify_password
from app.api.v1.caixas import registrar_movimento_caixa

logger = logging.getLogger(__name__)
router = APIRouter()

class PagamentoCreate(BaseModel):
    valor: float
    forma_pagamento: str
    observacao: str | None = None

class ItemVendaCreate(BaseModel):
    produto_id: UUID
    quantidade: int
    preco_unitario: float

class VendaCreate(BaseModel):
    cliente_id: UUID
    itens: List[ItemVendaCreate]
    observacao: str | None = None
    tipo_pagamento: str = "fiado" # "dinheiro", "fiado", "transferencia"

async def get_dono_loja(db: AsyncSession, loja_id: UUID) -> tuple[Usuario | None, UsuarioLoja | None]:
    stmt = (
        select(Usuario, UsuarioLoja)
     .join(UsuarioLoja, UsuarioLoja.usuario_id == Usuario.id)
     .where(UsuarioLoja.loja_id == loja_id)
     .where(UsuarioLoja.role == UserRole.DONO)
     .where(UsuarioLoja.is_active == True)
    )
    res = (await db.execute(stmt)).first()
    return (res[0], res[1]) if res else (None, None)

async def verify_dono_password(db: AsyncSession, loja_id: UUID, senha: str | None):
    if not senha:
        raise HTTPException(status_code=403, detail="Senha não informada")
    dono, _ = await get_dono_loja(db, loja_id)
    if not dono:
        raise HTTPException(status_code=404, detail="Dono da loja não encontrado")
    if not verify_password(senha, dono.senha_hash):
        raise HTTPException(status_code=403, detail="Senha do DONO incorreta")

async def _get_caixa_aberto_hoje(db: AsyncSession, loja_id: UUID) -> Caixa | None:
    hoje = date.today()
    stmt_caixa = select(Caixa).where(
        and_(
            Caixa.loja_id == loja_id,
            Caixa.status == StatusCaixa.ABERTO,
            func.date(Caixa.data_caixa) == hoje
        )
    )
    result_caixa = await db.execute(stmt_caixa)
    return result_caixa.scalar_one_or_none()

async def _cliente_to_out(db: AsyncSession, cliente: Cliente) -> ClienteOut: # <- ADICIONADO DE VOLTA
    total_divida = float(getattr(cliente, "total_divida", 0.0) or 0.0)
    ultima_compra: Optional[datetime] = getattr(cliente, "ultima_compra", None)
    status_cliente = "com_divida" if total_divida > 0 else "em_dia"

    return ClienteOut(
        id=str(getattr(cliente, "id")),
        loja_id=str(getattr(cliente, "loja_id")),
        nome=str(getattr(cliente, "nome") or ""),
        nome_empresa=getattr(cliente, "nome_empresa"),
        bi=getattr(cliente, "bi"),
        nif=getattr(cliente, "nif"), # <- ADICIONADO
        telefone=getattr(cliente, "telefone"),
        email=getattr(cliente, "email"),
        endereco=getattr(cliente, "endereco"),
        cidade=getattr(cliente, "cidade"),
        provincia=getattr(cliente, "provincia"),
        observacoes=getattr(cliente, "observacoes"),
        is_active=bool(getattr(cliente, "is_active")),
        created_at=getattr(cliente, "created_at"),
        total_divida=total_divida,
        ultima_compra=ultima_compra,
        status=status_cliente
    )

async def _atualizar_totais_cliente(db: AsyncSession, cliente_id: UUID):
    """Recalcula total_divida e ultima_compra do cliente"""
    stmt = select(func.coalesce(func.sum(Venda.total - Venda.valor_recebido), 0)).where(
        Venda.cliente_id == cliente_id,
        Venda.status.in_(["divida", "parcial"])
    )
    result = await db.execute(stmt)
    total_divida = float(result.scalar() or 0.0)

    stmt = select(Venda).where(Venda.cliente_id == cliente_id).order_by(Venda.created_at.desc())
    result = await db.execute(stmt)
    ultima_venda = result.scalars().first()
    ultima_compra = ultima_venda.created_at if ultima_venda else None

    await db.execute(
        update(Cliente)
     .where(Cliente.id == cliente_id)
     .values(total_divida=total_divida, ultima_compra=ultima_compra)
    )
    await db.commit()

@router.get("/{loja_id}/clientes", response_model=List[ClienteOut]) # <- ADICIONADO DE VOLTA
async def listar_clientes(
    loja_id: UUID,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)

    stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.is_active == True)

    # BUSCA POR NOME, NIF, BI
    if search and len(search) >= 2:
        search_like = f"%{search}%"
        stmt = stmt.where(
            or_(
                Cliente.nome.ilike(search_like),
                Cliente.bi.ilike(search_like),
                Cliente.nif.ilike(search_like)
            )
        )
        stmt = stmt.limit(10)
    else:
        stmt = stmt.order_by(Cliente.ultima_compra.desc().nulls_last(), Cliente.created_at.desc())

    result = await db.execute(stmt)
    clientes_db = result.scalars().all()

    clientes_out = [await _cliente_to_out(db, cliente) for cliente in clientes_db]
    return clientes_out

@router.post("/{loja_id}/clientes", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
async def criar_cliente(loja_id: UUID, cliente_in: ClienteCreate, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)

    if cliente_in.bi and cliente_in.bi.strip() != "":  # <- CORRIGIDO
        stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.bi == cliente_in.bi)
        result = await db.execute(stmt)
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="BI já cadastrado para esta loja")

    if cliente_in.nif and cliente_in.nif.strip() != "": # <- CORRIGIDO
        stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.nif == cliente_in.nif)
        result = await db.execute(stmt)
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="NIF já cadastrado para esta loja")

    data = cliente_in.model_dump()
    data["loja_id"] = loja_id
    data["total_divida"] = 0.0
    data["ultima_compra"] = None

    db_cliente = Cliente(**data)
    db.add(db_cliente)
    await db.commit()
    await db.refresh(db_cliente)
    return await _cliente_to_out(db, db_cliente)


@router.put("/{loja_id}/clientes/{cliente_id}", response_model=ClienteOut)
async def atualizar_cliente(
    loja_id: UUID, cliente_id: UUID, payload: dict = Body(...),
    db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)
    await verify_dono_password(db, loja_id, payload.get("senha_dono"))

    stmt = select(Cliente).where(Cliente.id == cliente_id, Cliente.loja_id == loja_id)
    db_cliente = (await db.execute(stmt)).scalar_one_or_none()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    dados_para_atualizar = {k: v for k, v in payload.items() if k!= "senha_dono"}

    # VALIDAÇÃO NIF NA EDIÇÃO
    if "nif" in dados_para_atualizar and dados_para_atualizar["nif"] and dados_para_atualizar["nif"].strip() != "":
        stmt = select(Cliente).where(
            Cliente.loja_id == loja_id,
            Cliente.nif == dados_para_atualizar["nif"],
            Cliente.id != cliente_id
        )
        result = await db.execute(stmt)
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="NIF já cadastrado para esta loja")

    # VALIDAÇÃO BI NA EDIÇÃO
    if "bi" in dados_para_atualizar and dados_para_atualizar["bi"] and dados_para_atualizar["bi"].strip() != "":
        stmt = select(Cliente).where(
            Cliente.loja_id == loja_id,
            Cliente.bi == dados_para_atualizar["bi"],
            Cliente.id != cliente_id
        )
        result = await db.execute(stmt)
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="BI já cadastrado para esta loja")

    for key, value in dados_para_atualizar.items():
        setattr(db_cliente, key, value)

    await db.commit()
    await db.refresh(db_cliente)
    return await _cliente_to_out(db, db_cliente)


@router.delete("/{loja_id}/clientes/{cliente_id}", status_code=status.HTTP_200_OK)
async def deletar_cliente(
    loja_id: UUID, cliente_id: UUID, payload: dict = Body(...),
    db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)
    await verify_dono_password(db, loja_id, payload.get("senha_dono"))

    stmt = select(Cliente).where(Cliente.id == cliente_id, Cliente.loja_id == loja_id)
    db_cliente = (await db.execute(stmt)).scalar_one_or_none()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    total_divida_atual = float(getattr(db_cliente, "total_divida", 0.0) or 0.0)
    if total_divida_atual > 0:
        raise HTTPException(status_code=400, detail="Não é possível apagar cliente com dívida em aberto")

    await db.delete(db_cliente)
    await db.commit()
    return {"message": "Cliente apagado com sucesso"}

@router.get("/{loja_id}/clientes/{cliente_id}/pendentes")
async def listar_pendencias_cliente(loja_id: UUID, cliente_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    stmt = select(Venda).where(Venda.loja_id == loja_id, Venda.cliente_id == cliente_id, Venda.status.in_(["divida", "parcial"])).order_by(Venda.created_at.desc())
    result = await db.execute(stmt)
    vendas = result.scalars().all()
    return [{
        "id": str(v.id), "data_venda": v.created_at, "total": float(v.total),
        "valor_recebido": float(v.valor_recebido), "saldo_devedor": float(float(v.total) - float(v.valor_recebido)),
        "status": v.status, "total_itens": v.total_itens
    } for v in vendas]

@router.get("/{loja_id}/clientes/{cliente_id}/historico")
async def listar_historico_cliente(loja_id: UUID, cliente_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    stmt = select(Venda).where(Venda.loja_id == loja_id, Venda.cliente_id == cliente_id).order_by(Venda.created_at.desc())
    result = await db.execute(stmt)
    vendas = result.scalars().all()
    return [{
        "id": str(v.id), "data_venda": v.created_at, "total": float(v.total),
        "valor_recebido": float(v.valor_recebido), "saldo_devedor": float(float(v.total) - float(v.valor_recebido)),
        "status": v.status, "total_itens": v.total_itens
    } for v in vendas]

@router.post("/{loja_id}/vendas", status_code=status.HTTP_201_CREATED)
async def criar_venda(
    loja_id: UUID, venda_in: VendaCreate, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)

    stmt = select(Cliente).where(Cliente.id == venda_in.cliente_id, Cliente.loja_id == loja_id)
    cliente = (await db.execute(stmt)).scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    total = Decimal(0)
    total_itens = 0
    for item in venda_in.itens:
        stmt = select(Produto).where(Produto.id == item.produto_id, Produto.loja_id == loja_id)
        produto = (await db.execute(stmt)).scalar_one_or_none()
        if not produto:
            raise HTTPException(status_code=404, detail=f"Produto {item.produto_id} não encontrado")
        if (produto.estoque or 0) < item.quantidade:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {produto.nome}")
        total += Decimal(str(item.preco_unitario)) * Decimal(item.quantidade)
        total_itens += item.quantidade

    is_fiado = venda_in.tipo_pagamento == "fiado"
    nova_venda = Venda(
        loja_id=loja_id,
        cliente_id=venda_in.cliente_id,
        usuario_id=current_user.id,
        total=float(total),
        valor_recebido=0.0 if is_fiado else float(total),
        status="divida" if is_fiado else "concluida",
        total_itens=total_itens,
        observacao=venda_in.observacao,
        forma_pagamento=venda_in.tipo_pagamento
    )
    db.add(nova_venda)
    await db.flush()

    for item in venda_in.itens:
        stmt = select(Produto).where(Produto.id == item.produto_id)
        produto = (await db.execute(stmt)).scalar_one()
        produto.estoque -= item.quantidade

    await _atualizar_totais_cliente(db, venda_in.cliente_id)
    await db.commit()
    await db.refresh(nova_venda)

    # REGISTRA NO CAIXA SE FOR A VISTA
    if not is_fiado:
        try:
            caixa_aberto = await _get_caixa_aberto_hoje(db, loja_id)
            if caixa_aberto:
                await registrar_movimento_caixa(
                    db=db, caixa_id=UUID(str(caixa_aberto.id)), loja_id=loja_id, tipo=TipoMovimentacao.ENTRADA,
                    valor=Decimal(str(nova_venda.total)), descricao=f"Venda #{str(nova_venda.id)[:8]} - {nova_venda.forma_pagamento}",
                    usuario_id=current_user.id, referencia_id=nova_venda.id, referencia_tipo='venda',
                    forma_pagamento=nova_venda.forma_pagamento
                )
                await db.commit()
            else:
                logger.warning(f"AVISO CAIXA: Nenhum caixa aberto HOJE para venda {nova_venda.id}")
        except Exception as e:
            logger.error(f"ERRO AO LANÇAR VENDA NO CAIXA: {e}", exc_info=True)

    return {
        "detail": "Dívida guardada com sucesso" if is_fiado else "Venda registrada com sucesso",
        "venda_id": str(nova_venda.id), "total": float(nova_venda.total), "status": nova_venda.status
    }




@router.post("/{loja_id}/clientes/{cliente_id}/receber-parcela")
async def receber_parcela(loja_id: UUID, cliente_id: UUID, pagamento: PagamentoCreate, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    if pagamento.valor <= 0:
        raise HTTPException(400, "Valor do pagamento deve ser maior que zero")
    stmt = select(Venda).where(Venda.loja_id == loja_id, Venda.cliente_id == cliente_id, Venda.status.in_(["divida", "parcial"])).order_by(Venda.created_at)
    dividas = (await db.execute(stmt)).scalars().all()
    if not dividas:
        raise HTTPException(status_code=404, detail="Cliente não possui dívidas")

    valor_restante = Decimal(str(pagamento.valor))
    total_pago = Decimal(0)
    for venda in dividas:
        if valor_restante <= 0:
            break
        divida_atual = Decimal(str(venda.total)) - Decimal(str(venda.valor_recebido))
        if divida_atual <= 0:
            continue
        valor_a_pagar = min(valor_restante, divida_atual)
        movimento = MovimentoVenda(venda_id=venda.id, loja_id=loja_id, cliente_id=cliente_id, usuario_id=current_user.id, valor_pago=float(valor_a_pagar), forma_pagamento=pagamento.forma_pagamento, observacao=pagamento.observacao)
        db.add(movimento)
        venda.valor_recebido = Decimal(str(venda.valor_recebido)) + valor_a_pagar
        venda.status = "concluida" if venda.valor_recebido >= Decimal(str(venda.total)) else "parcial"
        valor_restante -= valor_a_pagar
        total_pago += valor_a_pagar

    await _atualizar_totais_cliente(db, cliente_id)

    # ATUALIZA A HORA DA ULTIMA ATIVIDADE NO PAGAMENTO
    await db.execute(
        update(Cliente)
     .where(Cliente.id == cliente_id)
     .values(ultima_compra=func.now())
    )

    await db.commit()

    # REGISTRA NO CAIXA O RECEBIMENTO
    try:
        caixa_aberto = await _get_caixa_aberto_hoje(db, loja_id)
        if caixa_aberto and total_pago > 0:
            await registrar_movimento_caixa(
                db=db, caixa_id=UUID(str(caixa_aberto.id)), loja_id=loja_id, tipo=TipoMovimentacao.ENTRADA,
                valor=total_pago, descricao=f"Recebimento Dívida Cliente - {pagamento.forma_pagamento}",
                usuario_id=current_user.id, referencia_id=cliente_id, referencia_tipo='recebimento',
                forma_pagamento=pagamento.forma_pagamento
            )
            await db.commit()
    except Exception as e:
        logger.error(f"ERRO AO LANÇAR PAGAMENTO NO CAIXA: {e}", exc_info=True)

    return {"detail": f"Pagamento de {total_pago:.2f} KZ registrado com sucesso"}

@router.post("/{loja_id}/clientes/{cliente_id}/vendas/{venda_id}/pagar")
async def pagar_venda_especifica(
    loja_id: UUID, cliente_id: UUID, venda_id: UUID, pagamento: PagamentoCreate,
    db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)
    if pagamento.valor <= 0:
        raise HTTPException(400, "Valor do pagamento deve ser maior que zero")
    stmt = select(Venda).where(Venda.id == venda_id, Venda.loja_id == loja_id, Venda.cliente_id == cliente_id, Venda.status.in_(["divida", "parcial"]))
    venda = (await db.execute(stmt)).scalar_one_or_none()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada ou já paga")

    total_venda = Decimal(str(venda.total or 0))
    valor_recebido_atual = Decimal(str(venda.valor_recebido or 0))
    divida_atual = total_venda - valor_recebido_atual
    if divida_atual <= 0:
        raise HTTPException(status_code=400, detail="Esta venda já está paga")
    valor_a_pagar = min(Decimal(str(pagamento.valor)), divida_atual)

    movimento = MovimentoVenda(venda_id=venda.id, loja_id=loja_id, cliente_id=cliente_id, usuario_id=current_user.id, valor_pago=float(valor_a_pagar), forma_pagamento=pagamento.forma_pagamento, observacao=pagamento.observacao)
    db.add(movimento)
    novo_valor_recebido = valor_recebido_atual + valor_a_pagar
    venda.valor_recebido = novo_valor_recebido
    venda.status = "concluida" if novo_valor_recebido >= total_venda else "parcial"

    await _atualizar_totais_cliente(db, cliente_id)

    # ATUALIZA A HORA DA ULTIMA ATIVIDADE NO PAGAMENTO
    await db.execute(
        update(Cliente)
     .where(Cliente.id == cliente_id)
     .values(ultima_compra=func.now())
    )

    await db.commit()

    # REGISTRA NO CAIXA O PAGAMENTO
    try:
        caixa_aberto = await _get_caixa_aberto_hoje(db, loja_id)
        if caixa_aberto:
            await registrar_movimento_caixa(
                db=db, caixa_id=UUID(str(caixa_aberto.id)), loja_id=loja_id, tipo=TipoMovimentacao.ENTRADA,
                valor=valor_a_pagar, descricao=f"Recebimento Dívida #{str(venda.id)[:8]} - {pagamento.forma_pagamento}",
                usuario_id=current_user.id, referencia_id=venda.id, referencia_tipo='recebimento',
                forma_pagamento=pagamento.forma_pagamento
            )
            await db.commit()
    except Exception as e:
        logger.error(f"ERRO AO LANÇAR PAGAMENTO NO CAIXA: {e}", exc_info=True)

    return {"detail": f"Pagamento de {float(valor_a_pagar):.2f} KZ registrado para a venda {str(venda_id)[:8]}"}
