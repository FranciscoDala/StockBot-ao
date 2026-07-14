from fastapi import APIRouter, Depends, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select
from datetime import date
from typing import List
from uuid import UUID
import asyncio

from app.core.deps import get_current_user, require_role, get_current_loja_id
from app.schemas.usuario import Role
from app.models.usuario import Usuario
from app.models.venda import Venda
from app.models.itens_venda import ItemVenda
from app.models.produto import Produto
from app.db.session import get_db
from app.schemas.venda import VendaCreate, VendaRead
from app.services.venda import criar_venda, estornar_venda_service
from app.services.whatsapp import enviar_msg_venda
from app.websocket.manager import manager

router = APIRouter()

@router.post("/", response_model=VendaRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE, Role.VENDEDOR))])
async def criar_venda_endpoint(
    venda_in: VendaCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id: UUID = Depends(get_current_loja_id)
):
    venda = await criar_venda(db=db, venda_in=venda_in, usuario=current_user, loja_id=loja_id)

    if venda and venda.itens:
        for item in venda.itens:
            if isinstance(item, dict):
                produto_id = item.get("produto_id")
                nome_produto = item.get("nome_produto")
                novo_estoque = item.get("estoque_atual")
            else:
                produto_id = item.produto_id
                nome_produto = item.nome_produto
                novo_estoque = item.estoque_atual

            await manager.broadcast_to_loja(
                str(loja_id),
                {"tipo": "stock.updated", "produto_id": str(produto_id), "nome_produto": nome_produto, "novo_estoque": novo_estoque}
            )

    if venda:
        background_tasks.add_task(enviar_msg_venda, db, loja_id, venda)
    return venda

@router.get("/", response_model=List[VendaRead], dependencies=[Depends(require_role(Role.DONO, Role.GERENTE, Role.VENDEDOR))])
async def get_vendas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id_param: UUID | None = Query(None, alias="loja_id"),
    loja_id_token: UUID = Depends(get_current_loja_id),
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    vendedor_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(5000, ge=1, le=5000)
):
    loja_id_usar = loja_id_param or loja_id_token
    offset = (page - 1) * limit

    query = (
        select(Venda)
  .options(
       joinedload(Venda.usuario), # <- ESSENCIAL PRA NOME_VENDEDOR
       joinedload(Venda.itens).joinedload(ItemVenda.produto) # <- ESSENCIAL PRA NOME_PRODUTO
   )
  .where(Venda.loja_id == loja_id_usar)
  .order_by(Venda.created_at.desc())
  .limit(limit)
  .offset(offset)
    )

    if data_inicio:
        query = query.where(Venda.created_at >= data_inicio)
    if data_fim:
        query = query.where(Venda.created_at <= data_fim)
    if vendedor_id:
        query = query.where(Venda.usuario_id == vendedor_id)

    result = await db.execute(query)
    vendas = result.scalars().unique().all()
    return vendas

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def estornar_venda(id: UUID, db: AsyncSession = Depends(get_db), loja_id: UUID = Depends(get_current_loja_id)):
    itens_estornados = await estornar_venda_service(db=db, venda_id=id, loja_id=loja_id)
    if itens_estornados:
        for item in itens_estornados:
            if isinstance(item, dict):
                produto_id = item.get("produto_id")
                nome = item.get("nome")
                novo_estoque = item.get("novo_estoque")
            else:
                produto_id = item.produto_id
                nome = item.nome
                novo_estoque = item.novo_estoque
            await manager.broadcast_to_loja(str(loja_id),{"tipo": "stock.updated","produto_id": str(produto_id),"nome_produto": nome,"novo_estoque": novo_estoque})
    return None
