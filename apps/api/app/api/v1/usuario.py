from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import TYPE_CHECKING, Optional

from api.app.db.session import get_db
from api.app.schemas.usuario import UsuarioCreate, UsuarioOut, NivelUsuario
from api.app.models.usuario import Usuario
from api.app.core.deps import get_current_user, get_current_user_optional
from api.app.core.security import get_password_hash

if TYPE_CHECKING:
    from api.app.models.loja import Loja

router = APIRouter(prefix="", tags=["Usuarios"])

@router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def criar_usuario(
    usuario_in: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[Usuario] = Depends(get_current_user_optional)
):
    # 1. Verificar se email já existe
    result = await db.execute(select(Usuario).where(Usuario.email == usuario_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado")

    # 2. Verificar se já existe algum ADMIN no banco
    result_admin = await db.execute(select(Usuario).where(Usuario.nivel == NivelUsuario.ADMIN))
    existe_admin = result_admin.scalar_one_or_none() is not None

    # 3. Monta o dict pra criar o User - AQUI TAVA O BUG
    user_data = usuario_in.model_dump(exclude={"senha"}) # Tira a senha plana
    user_data['hashed_password'] = get_password_hash(usuario_in.senha) # <-- CORRIGIDO: era 'senha_hash'
    user_data['is_active'] = True

    # 4. Lógica de permissão: Bootstrap ou Regra normal
    if not existe_admin:
        if usuario_in.nivel!= NivelUsuario.ADMIN:
            raise HTTPException(status_code=403, detail="O primeiro usuário deve ser ADMIN")
        if current_user is not None:
            raise HTTPException(status_code=403, detail="Já existe um ADMIN. Login necessário para criar mais usuários.")
        novo_user = Usuario(**user_data)

    elif current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login necessário")

    elif current_user.nivel == NivelUsuario.ADMIN:
        novo_user = Usuario(**user_data)

    elif current_user.nivel == NivelUsuario.GERENTE:
        if usuario_in.nivel!= NivelUsuario.VENDEDOR:
            raise HTTPException(status_code=403, detail="Gerente só pode criar vendedores")
        if not current_user.lojas:
            raise HTTPException(status_code=400, detail="Gerente sem loja vinculada")
        novo_user = Usuario(**user_data)
        novo_user.lojas.append(current_user.lojas[0])

    else:
        raise HTTPException(status_code=403, detail="Vendedor não pode criar usuários")

    db.add(novo_user)
    await db.commit()
    await db.refresh(novo_user)
    return novo_user

@router.get("", response_model=list[UsuarioOut])
async def listar_usuarios(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.nivel == NivelUsuario.ADMIN:
        stmt = select(Usuario).where(Usuario.nivel == NivelUsuario.ADMIN)
    elif current_user.nivel == NivelUsuario.GERENTE:
        if not current_user.lojas:
            return []
        loja_id = current_user.lojas[0].id
        from api.app.models.loja import Loja
        stmt = select(Usuario).join(Usuario.lojas).where(Loja.id == loja_id, Usuario.nivel == NivelUsuario.VENDEDOR)
    else:
        raise HTTPException(status_code=403, detail="Sem permissão")

    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{user_id}", response_model=UsuarioOut)
async def ler_usuario(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    user = await db.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario não encontrado")

    if current_user.nivel == NivelUsuario.GERENTE:
        loja_ids_gerente = {l.id for l in current_user.lojas}
        loja_ids_user = {l.id for l in user.lojas}
        if not loja_ids_gerente.intersection(loja_ids_user) and user.nivel!= NivelUsuario.VENDEDOR:
            raise HTTPException(status_code=403, detail="Sem permissão para ver este usuário")

    return user