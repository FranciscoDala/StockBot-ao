from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List
from uuid import UUID # <- ADD

from api.app.core.deps import get_current_user, require_nivel
from api.app.models.usuario import Usuario, NivelUsuario
from api.app.db.session import get_db
from api.app.schemas.venda import VendaCreate, VendaRead
from api.app.services.venda import criar_venda, listar_vendas, estornar_venda_service

router = APIRouter()

@router.post("/", response_model=VendaRead, status_code=status.HTTP_201_CREATED)
async def criar_venda_endpoint(venda_in: VendaCreate, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return await criar_venda(db=db, venda_in=venda_in, usuario=current_user)

@router.get("/", response_model=List[VendaRead])
async def get_vendas(db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user), data_inicio: date | None = Query(None), data_fim: date | None = Query(None), vendedor_id: UUID | None = Query(None)): # <- MUDOU: int -> UUID
    return await listar_vendas(db, current_user, data_inicio, data_fim, vendedor_id)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_nivel(NivelUsuario.ADMIN, NivelUsuario.GERENTE))])
async def estornar_venda(id: UUID, db: AsyncSession = Depends(get_db)): # <- MUDOU: int -> UUID
    await estornar_venda_service(db=db, venda_id=id)
    return None