from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from pydantic import BaseModel
from jose import JWTError, jwt

from api.app.db.session import get_db
from api.app.core.security import verify_password, create_access_token
from api.app.core.config import settings
from api.app.models.usuario import Usuario
from api.app.models.usuario_loja import UsuarioLoja
from api.app.models.role import UserRole # <- CORRIGIDO AQUI
from api.app.schemas.usuario import userread, LoginResponse, LojaSelectOut, LoginRequest, Role # <- Role do schema pra response
from api.app.core.deps import get_current_user, oauth2_scheme

router = APIRouter()

class SelectLojaIn(BaseModel):
    loja_id: UUID

# DEPENDENCY: get_current_user_temp
async def get_current_user_temp(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sessão expirada. Faça login novamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role!= "multi_loja":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    stmt = select(Usuario).where(Usuario.id == UUID(user_id))
    user = (await db.execute(stmt)).scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuário inativo")
    return user

# FUNÇÃO: build_user_response
def build_user_response(user: Usuario, membro: UsuarioLoja | None = None, all_membros: list[UsuarioLoja] | None = None) -> dict:
    base = userread.model_validate(user).model_dump()

    if user.is_superuser:
        base["nivel"] = "admin"
        base["role"] = "admin"
        base["loja_id"] = None
        base["loja"] = None
        return base

    if membro:
        base["nivel"] = membro.role.value
        base["role"] = membro.role.value
        base["loja_id"] = str(membro.loja_id)
        base["loja"] = {"id": str(membro.loja.id), "nome": membro.loja.nome, "slug": membro.loja.slug, "is_active": membro.loja.is_active}
    else:
        roles = [m.role for m in all_membros] if all_membros else []
        if UserRole.DONO in roles: # <- CORRIGIDO
            base["nivel"] = "dono"
            base["role"] = "dono"
        elif UserRole.GERENTE in roles: # <- CORRIGIDO
            base["nivel"] = "gerente"
            base["role"] = "gerente"
        else:
            base["nivel"] = "funcionario"
            base["role"] = "funcionario"
        base["loja_id"] = None
        base["loja"] = None
    return base

# ROTA: POST /login
@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Usuario).where(Usuario.email == data.username)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user or not verify_password(data.password, user.senha_hash):
        raise HTTPException(status_code=400, detail="email ou senha incorretos")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="usuário inativo")
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="usuario nao verificado")

    if user.is_superuser:
        token = create_access_token({"sub": str(user.id), "role": "admin"})
        user_data = build_user_response(user, membro=None)
        return {"access_token": token, "token_type": "bearer", "user": user_data, "need_selection": False, "lojas": []}

    stmt = select(UsuarioLoja).options(selectinload(UsuarioLoja.loja)).where(
        UsuarioLoja.usuario_id == user.id,
        UsuarioLoja.is_active == True,
        UsuarioLoja.loja.has(is_active=True)
    )
    membros = (await db.execute(stmt)).scalars().all()

    if not membros:
        raise HTTPException(status_code=403, detail="Usuário sem loja vinculada")

    if len(membros) == 1:
        m = membros[0]
        token = create_access_token({"sub": str(user.id), "loja_id": str(m.loja_id), "role": m.role.value})
        user_data = build_user_response(user, membro=m)
        return {"access_token": token, "token_type": "bearer", "user": user_data, "need_selection": False, "lojas": []}

    roles = [m.role for m in membros]
    tem_cargo_gestao = UserRole.DONO in roles or UserRole.GERENTE in roles # <- CORRIGIDO

    token = create_access_token({"sub": str(user.id), "role": "multi_loja"}, expires_delta=5)
    user_data = build_user_response(user, membro=None, all_membros=membros)
    # Aqui usamos Role do schema pq o Pydantic espera string
    lojas_out = [LojaSelectOut(id=m.loja.id, nome=m.loja.nome, slug=m.loja.slug, role=Role(m.role.value)) for m in membros]

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data,
        "need_selection": True,
        "lojas": lojas_out,
        "redirect_to": "/admin/lojas" if tem_cargo_gestao else "/select-loja"
    }

# ROTA: POST /select-loja
@router.post("/select-loja", response_model=LoginResponse)
async def select_loja(body: SelectLojaIn, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user_temp)):
    stmt = select(UsuarioLoja).options(selectinload(UsuarioLoja.loja)).where(
        UsuarioLoja.usuario_id == current_user.id,
        UsuarioLoja.loja_id == body.loja_id,
        UsuarioLoja.is_active == True,
        UsuarioLoja.loja.has(is_active=True)
    )
    membro = (await db.execute(stmt)).scalar_one_or_none()
    if not membro:
        raise HTTPException(status_code=403, detail="Acesso negado a esta loja")

    token = create_access_token({"sub": str(current_user.id), "loja_id": str(membro.loja_id), "role": membro.role.value})
    user_data = build_user_response(current_user, membro=membro)
    return {"access_token": token, "token_type": "bearer", "user": user_data, "need_selection": False, "lojas": []}
