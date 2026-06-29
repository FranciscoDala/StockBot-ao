from typing import Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from uuid import UUID

from app.core.config import settings
from app.db.session import get_db
from app.models.usuario import Usuario, NivelAcesso

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None: raise credentials_exception
        user_id = UUID(user_id_str) # <- Converte str pra UUID
    except (JWTError, ValueError): raise credentials_exception

    result = await db.execute(select(Usuario).filter(Usuario.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.ativo: raise credentials_exception # <- Bloqueia inativo
    return user

def require_nivel(*niveis_permitidos: NivelAcesso) -> Callable:
    def nivel_checker(current_user: Usuario = Depends(get_current_user)):
        if current_user.nivel not in niveis_permitidos:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Sem permissao. Nivel requerido: {[n.value for n in niveis_permitidos]}")
        return current_user
    return nivel_checker