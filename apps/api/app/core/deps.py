from typing import Callable, TypedDict
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError, ExpiredSignatureError
from uuid import UUID

from  app.core.config import settings
from  app.db.session import get_db
from  app.models.usuario import Usuario
from  app.models.loja import Loja
from  app.models.usuario_loja import UsuarioLoja
from  app.models.role import UserRole # <- CORRIGIDO 1

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class Membership(TypedDict):
    user: Usuario
    loja_id: UUID | None
    role: UserRole # <- CORRIGIDO 2
    loja: Loja | None

async def get_current_membership(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Membership:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        loja_id_str: str = payload.get("loja_id")
        role_str: str = payload.get("role")

        if not user_id_str:
            raise credentials_exception

        user_id = UUID(user_id_str)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token expirado", headers={"WWW-Authenticate": "Bearer"})
    except (JWTError, ValueError):
        raise credentials_exception

    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=403, detail="usuario invalido ou inativo")

    # REGRA ADMIN
    if user.is_superuser:
        if role_str != "admin":
            raise credentials_exception
        return {"user": user, "loja_id": None, "role": UserRole.DONO, "loja": None} # <- CORRIGIDO 3

    if not all([loja_id_str, role_str]):
        raise credentials_exception

    loja_id = UUID(loja_id_str)
    role = UserRole(role_str) # <- CORRIGIDO 4

    stmt = select(UsuarioLoja).options(selectinload(UsuarioLoja.loja)).where(
        UsuarioLoja.usuario_id == user_id,
        UsuarioLoja.loja_id == loja_id,
        UsuarioLoja.is_active == True
    )
    membro = (await db.execute(stmt)).scalar_one_or_none()
    if not membro or membro.role != role:
        raise HTTPException(status_code=403, detail="acesso negado a esta loja")

    if not membro.loja.is_active:
        raise HTTPException(status_code=403, detail="loja desativada")

    return {"user": user, "loja_id": loja_id, "role": role, "loja": membro.loja}

async def get_current_user(m: Membership = Depends(get_current_membership)) -> Usuario:
    return m["user"]

async def get_current_active_user(m: Membership = Depends(get_current_membership)) -> Usuario:
    return m["user"]

async def get_current_admin(token: str = Depends(oauth2_scheme)) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Apenas super admin")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="token invalido", headers={"WWW-Authenticate": "Bearer"})

def require_role(*roles_permitidos: UserRole) -> Callable: # <- CORRIGIDO 5
    def role_checker(m: Membership = Depends(get_current_membership)):
        if m["role"] not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"sem permissao. role requerido: {[r.value for r in roles_permitidos]}"
            )
        return m
    return role_checker

async def get_current_loja_id(m: Membership = Depends(get_current_membership)) -> UUID:
    if m["loja_id"] is None:
        raise HTTPException(status_code=400, detail="Admin não está vinculado a uma loja")
    return m["loja_id"]

async def get_current_loja(m: Membership = Depends(get_current_membership)) -> Loja:
    if m["loja"] is None:
        raise HTTPException(status_code=400, detail="Admin não está vinculado a uma loja")
    return m["loja"]

# HELPER CORRIGIDO: usa UsuarioLoja em vez de Funcionario
async def verificar_acesso_loja(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.is_superuser:
        return True

    stmt = select(UsuarioLoja).where( # <- CORRIGIDO 6
        UsuarioLoja.usuario_id == current_user.id,
        UsuarioLoja.loja_id == loja_id,
        UsuarioLoja.role == UserRole.DONO, # <- CORRIGIDO 7
        UsuarioLoja.is_active == True
    )
    membro = (await db.execute(stmt)).scalar_one_or_none()

    if not membro:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar esta loja"
        )
    return True
