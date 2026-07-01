from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from api.app.core.config import settings
from api.app.models.usuario import Usuario, NivelUsuario
from api.app.models.loja import Loja

# Argon2 = top. Sem limite de 72 bytes do bcrypt
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Usuario:
    """Retorna o user ou lança HTTPException com a mensagem certa"""
    stmt = select(Usuario).options(
        selectinload(Usuario.lojas_dono),
        selectinload(Usuario.lojas_gerente)
    ).where(Usuario.email == email)

    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password): # <- usa hashed_password
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha incorretos")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inativo")

    # <- REGRA NOVA: Bloquear gerente se a loja estiver inativa
    if user.nivel == NivelUsuario.GERENTE:
        loja_do_gerente = user.lojas_gerente[0] if user.lojas_gerente else None
        if not loja_do_gerente:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário sem loja vinculada. Fala com o Admin.")
        if not loja_do_gerente.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="A sua loja foi desativada, vá até o escritório ou entra em contacto com o admin da stocckbot"
            )

    if user.nivel == NivelUsuario.VENDEDOR and not user.lojas_gerente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário sem loja vinculada. Fala com o Admin.")
        
    return user