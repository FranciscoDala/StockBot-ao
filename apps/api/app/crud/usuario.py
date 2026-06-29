from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate
from app.core.security import get_password_hash

async def get_user_by_email(db: AsyncSession, email: str) -> Usuario | None:
    result = await db.execute(select(Usuario).filter(Usuario.email == email))
    return result.scalars().first()

async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Usuario | None: # <- ADICIONEI PRA DEPS
    result = await db.execute(select(Usuario).filter(Usuario.id == user_id))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: UsuarioCreate) -> Usuario:
    hashed_password = get_password_hash(user_in.senha)
    db_user = Usuario(
        nome=user_in.nome,
        email=user_in.email,
        senha_hash=hashed_password,
        nivel=user_in.nivel,
        ativo=True
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user