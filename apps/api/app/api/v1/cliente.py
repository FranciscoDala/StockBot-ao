from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, update, delete
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal

from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.venda import Venda
from app.models.movimentacao_venda import MovimentoVenda
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from app.models.role import UserRole
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteOut
from app.core.deps import get_current_user, verificar_acesso_loja
from app.core.security import verify_password

router = APIRouter()

class PagamentoCreate(BaseModel):
    valor: float
    forma_pagamento: str
    observacao: str | None = None

class ClienteDeleteAuth(BaseModel):
    senha_dono: str = Field(..., min_length=1)

class ClienteUpdateAuth(ClienteUpdate): # <- NOVO: herda do ClienteUpdate e adiciona senha
    senha_dono: str = Field(..., min_length=1)

async def get_dono_loja(db: AsyncSession, loja_id: UUID) -> tuple[Usuario | None, UsuarioLoja | None]:
    stmt = (select(Usuario, UsuarioLoja).join(UsuarioLoja, UsuarioLoja.usuario_id == Usuario.id)
          .where(UsuarioLoja.loja_id == loja_id)
          .where(UsuarioLoja.role == UserRole.DONO)
          .where(UsuarioLoja.is_active == True))
    res = (await db.execute(stmt)).first()
    return (res[0], res[1]) if res else (None, None)

async def verify_dono_password(db: AsyncSession, loja_id: UUID, senha: str):
    if not senha: raise HTTPException(status_code=403, detail="Senha não informada")
    dono, _ = await get_dono_loja(db, loja_id)
    if not dono: raise HTTPException(status_code=404, detail="Dono da loja não encontrado")
    if not verify_password(senha, dono.senha_hash):
        raise HTTPException(status_code=403, detail="Senha do DONO incorreta")

async def _cliente_to_out(db: AsyncSession, cliente: Cliente) -> ClienteOut:
    total_divida = float(getattr(cliente, "total_divida", 0.0) or 0.0)
    ultima_compra: Optional[datetime] = getattr(cliente, "ultima_compra", None)
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



@router.get("/{loja_id}/clientes", response_model=List[ClienteOut])
async def listar_clientes(loja_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    print(f"[LISTAR_CLIENTES] INICIO - loja_id: {loja_id} - user_id: {current_user.id} - email: {current_user.email}")

    try:
        print("[LISTAR_CLIENTES] 1. Verificando acesso a loja...")
        await verificar_acesso_loja(loja_id, db, current_user)
        print("[LISTAR_CLIENTES] 2. Acesso OK")

        print("[LISTAR_CLIENTES] 3. Montando query com JOIN...")
        stmt = (
            select(
                Cliente,
                func.coalesce(func.sum(Venda.total - Venda.valor_recebido), 0).label("total_divida_calc"),
                func.max(Venda.created_at).label("ultima_compra_calc")
            )
          .outerjoin(Venda, Venda.cliente_id == Cliente.id)
          .where(Cliente.loja_id == loja_id, Cliente.is_active == True)
          .group_by(Cliente.id)
          .order_by(func.max(Venda.created_at).desc())
        )
        print("[LISTAR_CLIENTES] 4. Executando query no banco...")
        result = await db.execute(stmt)
        rows = result.all()
        print(f"[LISTAR_CLIENTES] 5. Query OK - Retornou {len(rows)} linhas")

        clientes_out = []
        for i, (cliente, total_divida_calc, ultima_compra_calc) in enumerate(rows):
            total_divida = float(total_divida_calc or 0.0)
            status_cliente = "com_divida" if total_divida > 0 else "em_dia"

            clientes_out.append(ClienteOut(
                id=cliente.id,
                loja_id=cliente.loja_id,
                nome=cliente.nome,
                nome_empresa=cliente.nome_empresa,
                bi=cliente.bi,
                telefone=cliente.telefone,
                email=cliente.email,
                endereco=cliente.endereco,
                cidade=cliente.cidade,
                provincia=cliente.provincia,
                observacoes=cliente.observacoes,
                is_active=cliente.is_active,
                created_at=cliente.created_at,
                total_divida=total_divida,
                ultima_compra=ultima_compra_calc,
                status=status_cliente
            ))
            if i < 3: # só loga os 3 primeiros pra não poluir
                print(f"[LISTAR_CLIENTES] Cliente {i+1}: {cliente.nome} - Divida: {total_divida}")

        print(f"[LISTAR_CLIENTES] 6. FIM - Retornando {len(clientes_out)} clientes")
        return clientes_out

    except Exception as e:
        print(f"[LISTAR_CLIENTES] ERRO CRITICO: {type(e).__name__} - {e}")
        import traceback
        traceback.print_exc() # imprime stack trace completo no log do Render
        raise HTTPException(status_code=500, detail=f"Erro interno ao listar clientes: {str(e)}")



@router.post("/{loja_id}/clientes", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
async def criar_cliente(loja_id: UUID, cliente_in: ClienteCreate, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    if cliente_in.bi:
        stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.bi == cliente_in.bi)
        result = await db.execute(stmt)
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="BI já cadastrado para esta loja")

    data = cliente_in.model_dump(exclude_unset=True)
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
    loja_id: UUID, cliente_id: UUID, body: ClienteUpdateAuth, # <- AGORA PEDE SENHA
    db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)
    await verify_dono_password(db, loja_id, body.senha_dono) # <- PADRONIZADO COM EQUIPA

    stmt = select(Cliente).where(Cliente.id == cliente_id, Cliente.loja_id == loja_id)
    db_cliente = (await db.execute(stmt)).scalar_one_or_none()
    if not db_cliente: raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # tira a senha do dict pra não tentar salvar no banco
    dados_para_atualizar = body.model_dump(exclude_unset=True)
    dados_para_atualizar.pop("senha_dono", None)

    for key, value in dados_para_atualizar.items():
        setattr(db_cliente, key, value)

    await db.commit()
    await db.refresh(db_cliente)
    return await _cliente_to_out(db, db_cliente)

@router.delete("/{loja_id}/clientes/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_cliente(
    loja_id: UUID, cliente_id: UUID, body: ClienteDeleteAuth,
    db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)
    await verify_dono_password(db, loja_id, body.senha_dono)

    stmt = select(Cliente).where(Cliente.id == cliente_id, Cliente.loja_id == loja_id)
    db_cliente = (await db.execute(stmt)).scalar_one_or_none()
    if not db_cliente: raise HTTPException(status_code=404, detail="Cliente não encontrado")

    total_divida_atual = float(getattr(db_cliente, "total_divida", 0.0) or 0.0)

    if total_divida_atual > 0:
        raise HTTPException(status_code=400, detail="Não é possível apagar cliente com dívida em aberto")

    await db.delete(db_cliente)
    await db.commit()
    return

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

@router.post("/{loja_id}/clientes/{cliente_id}/receber-parcela")
async def receber_parcela(loja_id: UUID, cliente_id: UUID, pagamento: PagamentoCreate, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    if pagamento.valor <= 0: raise HTTPException(400, "Valor do pagamento deve ser maior que zero")
    stmt = select(Venda).where(Venda.loja_id == loja_id, Venda.cliente_id == cliente_id, Venda.status.in_(["divida", "parcial"])).order_by(Venda.created_at)
    dividas = (await db.execute(stmt)).scalars().all()
    if not dividas: raise HTTPException(status_code=404, detail="Cliente não possui dívidas")

    valor_restante = Decimal(str(pagamento.valor))
    total_pago = Decimal(0)
    for venda in dividas:
        if valor_restante <= 0: break
        divida_atual = Decimal(str(venda.total)) - Decimal(str(venda.valor_recebido))
        if divida_atual <= 0: continue
        valor_a_pagar = min(valor_restante, divida_atual)
        movimento = MovimentoVenda(venda_id=venda.id, loja_id=loja_id, cliente_id=cliente_id, usuario_id=current_user.id, valor_pago=float(valor_a_pagar), forma_pagamento=pagamento.forma_pagamento, observacao=pagamento.observacao)
        db.add(movimento)
        venda.valor_recebido = float(Decimal(str(venda.valor_recebido)) + valor_a_pagar)
        venda.status = "concluida" if float(venda.valor_recebido) >= float(venda.total) else "parcial"
        valor_restante -= valor_a_pagar
        total_pago += valor_a_pagar

    await _atualizar_totais_cliente(db, cliente_id)
    await db.commit()
    return {"detail": f"Pagamento de {total_pago:.2f} KZ registrado com sucesso"}

@router.post("/{loja_id}/clientes/{cliente_id}/vendas/{venda_id}/pagar")
async def pagar_venda_especifica(loja_id: UUID, cliente_id: UUID, venda_id: UUID, pagamento: PagamentoCreate, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    if pagamento.valor <= 0: raise HTTPException(400, "Valor do pagamento deve ser maior que zero")
    stmt = select(Venda).where(Venda.id == venda_id, Venda.loja_id == loja_id, Venda.cliente_id == cliente_id, Venda.status.in_(["divida", "parcial"]))
    venda = (await db.execute(stmt)).scalar_one_or_none()
    if not venda: raise HTTPException(status_code=404, detail="Venda não encontrada ou já paga")

    total_venda = Decimal(str(venda.total or 0))
    valor_recebido_atual = Decimal(str(venda.valor_recebido or 0))
    divida_atual = total_venda - valor_recebido_atual
    if divida_atual <= 0: raise HTTPException(status_code=400, detail="Esta venda já está paga")

    valor_a_pagar = min(Decimal(str(pagamento.valor)), divida_atual)
    movimento = MovimentoVenda(venda_id=venda.id, loja_id=loja_id, cliente_id=cliente_id, usuario_id=current_user.id, valor_pago=float(valor_a_pagar), forma_pagamento=pagamento.forma_pagamento, observacao=pagamento.observacao)
    db.add(movimento)
    novo_valor_recebido = valor_recebido_atual + valor_a_pagar
    venda.valor_recebido = float(novo_valor_recebido)
    venda.status = "concluida" if novo_valor_recebido >= total_venda else "parcial"

    await _atualizar_totais_cliente(db, cliente_id)
    await db.commit()
    return {"detail": f"Pagamento de {float(valor_a_pagar):.2f} KZ registrado para a venda {str(venda_id)[:8]}"}
