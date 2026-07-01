from typing import Callable, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError
from uuid import UUID

from api.app.core.config import settings
from api.app.db.session import get_db
from api.app.models.usuario import Usuario
from api.app.schemas.usuario import NivelUsuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False) # <- auto_error=False pra deixar opcional

async def _decode_token(token: str, db: AsyncSession) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None: raise credentials_exception
        user_id = UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active: # <- Corrigido: is_active
        raise credentials_exception
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Usuario:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não enviado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await _decode_token(token, db)

async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Optional[Usuario]:
    """Versão que retorna None se não tiver token. Pra rota de bootstrap."""
    if not token:
        return None
    try:
        return await _decode_token(token, db)
    except HTTPException:
        return None # Se o token for inválido, trata como se não tivesse

async def get_current_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    return current_user

async def get_current_active_superuser(current_user: Usuario = Depends(get_current_active_user)) -> Usuario:
    """Bloqueio: Só Admin."""
    if current_user.nivel!= NivelUsuario.ADMIN: # <- Corrigido: ADMIN maiúsculo
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente. Apenas Admin."
        )
    return current_user

def require_nivel(*niveis_permitidos: NivelUsuario) -> Callable:
    def nivel_checker(current_user: Usuario = Depends(get_current_user)):
        if current_user.nivel not in niveis_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Sem permissao. Nivel requerido: {[n.value for n in niveis_permitidos]}"
            )
        return current_user
    return nivel_checker