from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.loja import Loja
from app.core.deps import get_current_user
from app.schemas.loja import LojaCreate, LojaRead

router = APIRouter()

@router.post("/lojas", response_model=LojaRead)
async def create_loja(
    loja_in: LojaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    # 1. Verifica se já tem loja. Guarda em uma variável!
    stmt = select(Loja).where(Loja.usuario_id_dono == current_user.id)
    result = await db.execute(stmt)
    existing_loja = result.scalar_one_or_none() # <- Guarda aqui

    if existing_loja:
        raise HTTPException(status_code=400, detail="Tu já tens uma loja cadastrada")

    # 2. Cria a nova loja
    nova_loja = Loja(**loja_in.model_dump(), usuario_id_dono=current_user.id)
    db.add(nova_loja)
    await db.commit()
    await db.refresh(nova_loja)
    
    return nova_loja


@router.get("/lojas/me", response_model=LojaRead)
async def read_my_loja(db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    result = await db.execute(select(Loja).where(Loja.usuario_id == current_user.id))
    loja = result.scalar_one_or_none()
    if not loja:
        raise HTTPException(status_code=404, detail="Cria uma loja primeiro em POST /lojas")
    return loja