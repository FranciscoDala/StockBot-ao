from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.usuario import Usuario 
from app.schemas.usuario import UsuarioCreate 
from app.core.security import get_password_hash



async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(Usuario).filter(Usuario.email == email))
    return result.scalars().first()

async def create_user(db: AsyncSession, user: UsuarioCreate):
    hashed_password = get_password_hash(user.password)
    db_user = Usuario(
        nome=user.nome, 
        email=user.email, 
        senha_hash=hashed_password,
        nivel=user.nivel
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user