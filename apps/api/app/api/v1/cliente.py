from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession # <- MUDA AQUI
from sqlalchemy import func, select # <- adiciona select
from typing import List, cast
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.models.cliente import Cliente
from app.models.venda import Venda
from app.schemas.cliente import ClienteCreate, ClienteOut
from app.core.deps import get_current_user

router = APIRouter()

async def _cliente_to_out(db: AsyncSession, cliente: Cliente) -> ClienteOut: # <- async
    # total_divida
    stmt = select(func.coalesce(func.sum(Venda.total), 0)).where(
        Venda.cliente_id == cliente.id,
        Venda.status == "pendente"
    )
    result = await db.execute(stmt) # <- await
    total_divida = result.scalar() or 0.0

    # ultima_venda
    stmt = select(Venda).where(Venda.cliente_id == cliente.id).order_by(Venda.created_at.desc())
    result = await db.execute(stmt) # <- await
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
async def listar_clientes( # <- async
    loja_id: UUID,
    db: AsyncSession = Depends(get_db), # <- AsyncSession
    current_user = Depends(get_current_user)
):
    stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.is_active == True) # <- select
    result = await db.execute(stmt) # <- await
    clientes = result.scalars().all()
    return [await _cliente_to_out(db, c) for c in clientes] # <- await

@router.post("/{loja_id}/clientes", response_model=ClienteOut, status_code=status.HTTP_201_CREATED)
async def criar_cliente( # <- async
    loja_id: UUID,
    cliente_in: ClienteCreate,
    db: AsyncSession = Depends(get_db), # <- AsyncSession
    current_user = Depends(get_current_user)
):
    if cliente_in.bi:
        stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.bi == cliente_in.bi) # <- select
        result = await db.execute(stmt) # <- await
        existe = result.scalars().first()
        if existe: raise HTTPException(status_code=400, detail="BI já cadastrado para esta loja")

    data = cliente_in.model_dump()
    data["loja_id"] = loja_id
    db_cliente = Cliente(**data)

    db.add(db_cliente)
    await db.commit() # <- await
    await db.refresh(db_cliente) # <- await
    return await _cliente_to_out(db, db_cliente) # <- await

@router.get("/{loja_id}/clientes/{cliente_id}/pendentes")
async def listar_pendencias_cliente( # <- async
    loja_id: UUID,
    cliente_id: UUID,
    db: AsyncSession = Depends(get_db), # <- AsyncSession
    current_user = Depends(get_current_user)
):
    stmt = select(Venda).where(
        Venda.loja_id == loja_id,
        Venda.cliente_id == cliente_id,
        Venda.status == "pendente"
    ).order_by(Venda.created_at.desc())
    result = await db.execute(stmt) # <- await
    vendas = result.scalars().all()

    return [{
        "id": str(v.id),
        "data_venda": v.created_at,
        "total": float(v.total),
        "total_itens": v.total_itens
    } for v in vendas]

@router.post("/{loja_id}/clientes/{cliente_id}/receber")
async def receber_pagamento_cliente( # <- async
    loja_id: UUID,
    cliente_id: UUID,
    db: AsyncSession = Depends(get_db), # <- AsyncSession
    current_user = Depends(get_current_user)
):
    stmt = select(Venda).where(
        Venda.loja_id == loja_id,
        Venda.cliente_id == cliente_id,
        Venda.status == "pendente"
    )
    result = await db.execute(stmt) # <- await
    vendas_pendentes = result.scalars().all()

    if not vendas_pendentes:
        raise HTTPException(status_code=404, detail="Cliente não possui dívidas")

    for venda in vendas_pendentes:
        venda.status = "concluida"
        venda.valor_recebido = venda.total
        venda.forma_pagamento = "Dinheiro"

    await db.commit() # <- await
    return {"detail": f"{len(vendas_pendentes)} vendas quitadas com sucesso"}
