from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from pydantic import BaseModel
from jose import JWTError, jwt, ExpiredSignatureError
from datetime import timedelta

from app.db.session import get_db
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from app.models.role import UserRole
from app.schemas.usuario import userread, LoginResponse, LojaSelectOut, LoginRequest, Role
from app.core.deps import get_current_user, oauth2_scheme

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
        if user_id is None or role!= UserRole.MULTI_LOJA.value: # CORRECAO 1: MAIUSCULO
            raise credentials_exception
        user_id_uuid = UUID(user_id)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token expirado", headers={"WWW-Authenticate": "Bearer"})
    except (JWTError, ValueError):
        raise credentials_exception

    stmt = select(Usuario).where(Usuario.id == user_id_uuid)
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
        base["nivel"] = UserRole.ADMIN.value
        base["role"] = UserRole.ADMIN.value
        base["loja_id"] = None
        base["loja"] = None
        return base

    if membro:
        # USUARIO COM 1 LOJA - ENTRA DIRETO
        base["nivel"] = membro.role.value
        base["role"] = membro.role.value
        base["loja_id"] = str(membro.loja_id)
        base["loja"] = {"id": str(membro.loja.id), "nome": membro.loja.nome, "slug": membro.loja.slug, "is_active": membro.loja.is_active}
    else:
        # USUARIO COM 2+ LOJAS - TELA DE SELECAO
        roles = [m.role for m in all_membros] if all_membros else []

        # Pega o maior cargo pra mostrar no card de seleção
        if UserRole.DONO in roles:
            base["nivel"] = UserRole.DONO.value
            base["role"] = UserRole.DONO.value
        elif UserRole.GERENTE in roles:
            base["nivel"] = UserRole.GERENTE.value
            base["role"] = UserRole.GERENTE.value
        elif UserRole.CAIXA in roles:
            base["nivel"] = UserRole.CAIXA.value # <- CORRIGIDO
            base["role"] = UserRole.CAIXA.value # <- CORRIGIDO
        elif UserRole.ESTOQUISTA in roles:
            base["nivel"] = UserRole.ESTOQUISTA.value # <- CORRIGIDO
            base["role"] = UserRole.ESTOQUISTA.value # <- CORRIGIDO
        else:
            base["nivel"] = UserRole.VENDEDOR.value
            base["role"] = UserRole.VENDEDOR.value

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
        token = create_access_token({"sub": str(user.id), "role": UserRole.ADMIN.value}) # CORRECAO 4
        user_data = build_user_response(user, membro=None)
        return {"access_token": token, "token_type": "bearer", "user": user_data, "need_selection": False, "lojas": []}

    # BUSCA TODAS AS LOJAS VINCULADAS ATIVAS E INATIVAS
    stmt_all = select(UsuarioLoja).options(selectinload(UsuarioLoja.loja)).where(
        UsuarioLoja.usuario_id == user.id,
        UsuarioLoja.is_active == True,
        UsuarioLoja.loja.has(deleted_at=None)
    )
    todos_membros = (await db.execute(stmt_all)).scalars().all()

    if not todos_membros:
        raise HTTPException(status_code=403, detail="Usuário sem loja vinculada")

    # SEPARA ATIVAS E INATIVAS
    membros_ativos = [m for m in todos_membros if m.loja.is_active == True]
    membros_inativos = [m for m in todos_membros if m.loja.is_active == False]

    # SE TEM SÓ LOJA INATIVA = BLOQUEIA
    if not membros_ativos and membros_inativos:
        raise HTTPException(status_code=403, detail="Loja desativada")

    # USA SÓ AS ATIVAS PRA LOGAR
    membros = membros_ativos

    if len(membros) == 1:
        m = membros[0]
        token = create_access_token({"sub": str(user.id), "loja_id": str(m.loja_id), "role": m.role.value})
        user_data = build_user_response(user, membro=m)
        return {"access_token": token, "token_type": "bearer", "user": user_data, "need_selection": False, "lojas": []}

    roles = [m.role for m in membros]
    tem_cargo_gestao = UserRole.DONO in roles or UserRole.GERENTE in roles

    token = create_access_token({"sub": str(user.id), "role": UserRole.MULTI_LOJA.value}, expires_delta=timedelta(minutes=5)) # CORRECAO 5
    user_data = build_user_response(user, membro=None, all_membros=membros)
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
        UsuarioLoja.loja.has(deleted_at=None)
    )
    membro = (await db.execute(stmt)).scalar_one_or_none()
    if not membro:
        raise HTTPException(status_code=403, detail="Acesso negado a esta loja")

    # BLOQUEIA SE A LOJA SELECIONADA ESTIVER INATIVA
    if not membro.loja.is_active:
        raise HTTPException(status_code=403, detail="Loja desativada")

    token = create_access_token({"sub": str(current_user.id), "loja_id": str(membro.loja_id), "role": membro.role.value})
    user_data = build_user_response(current_user, membro=membro)
    return {"access_token": token, "token_type": "bearer", "user": user_data, "need_selection": False, "lojas": []}
