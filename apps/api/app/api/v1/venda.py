from fastapi import APIRouter, Depends, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List
from uuid import UUID
import asyncio

from app.core.deps import get_current_user, require_role, get_current_loja_id
from app.schemas.usuario import Role
from app.models.usuario import Usuario
from app.db.session import get_db
from app.schemas.venda import VendaCreate, VendaRead
from app.services.venda import criar_venda, listar_vendas, estornar_venda_service
from app.services.whatsapp import enviar_msg_venda # <- NOVO

from app.websocket.manager import manager

router = APIRouter()

@router.post("/", response_model=VendaRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE, Role.VENDEDOR))])
async def criar_venda_endpoint(
    venda_in: VendaCreate,
    background_tasks: BackgroundTasks, # <- NOVO
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id: UUID = Depends(get_current_loja_id)
):
    venda = await criar_venda(db=db, venda_in=venda_in, usuario=current_user, loja_id=loja_id)

    # 1. DISPARA WS PRA CADA PRODUTO DA VENDA
    if venda and venda.itens:
        for item in venda.itens:
            await manager.broadcast_to_loja(
                str(loja_id),
                {
                    "tipo": "stock.updated",
                    "produto_id": str(item["produto_id"]),
                    "nome_produto": item["nome_produto"],
                    "novo_estoque": item["estoque_atual"]
                }
            )

    # 2. DISPARA WHATSAPP EM BACKGROUND PRA NAO TRAVAR
    if venda:
        background_tasks.add_task(enviar_msg_venda, db, loja_id, venda)

    return venda

@router.get("/", response_model=List[VendaRead], dependencies=[Depends(require_role(Role.DONO, Role.GERENTE, Role.VENDEDOR))])
async def get_vendas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id: UUID = Depends(get_current_loja_id),
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    vendedor_id: UUID | None = Query(None)
):
    return await listar_vendas(db, current_user, loja_id, data_inicio, data_fim, vendedor_id)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def estornar_venda(id: UUID, db: AsyncSession = Depends(get_db), loja_id: UUID = Depends(get_current_loja_id)):
    itens_estornados = await estornar_venda_service(db=db, venda_id=id, loja_id=loja_id)

    # DISPARA WS PRA DEVOLVER O ESTOQUE
    if itens_estornados:
        for item in itens_estornados:
            await manager.broadcast_to_loja(
                str(loja_id),
                {
                    "tipo": "stock.updated",
                    "produto_id": str(item["produto_id"]),
                    "nome_produto": item["nome"],
                    "novo_estoque": item["novo_estoque"]
                }
            )
    return None
