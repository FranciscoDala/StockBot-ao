from fastapi import APIRouter, Depends
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from  app.core.deps import get_current_user, get_db
from  app.models.usuario import Usuario
from  app.schemas.usuario import userread # <- minúsculo

router = APIRouter()

@router.get("/users/me", response_model=userread)
async def read_users_me(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Usuario).options(joinedload(Usuario.loja)).where(Usuario.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one()
    return user
