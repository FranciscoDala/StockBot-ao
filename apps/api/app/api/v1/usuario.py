from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List

from app.db.session import get_db
from app.schemas.usuario import UserRead
from app.schemas.usuario_loja import UsuarioLojaCreateIn, UsuarioLojaUpdateIn, UsuarioLojaOut
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from app.models.loja import Loja
from app.core.deps import require_role, get_current_loja_id, get_current_user
from app.core.security import get_password_hash, verify_password
from app.models.role import UserRole

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

@router.post("", response_model=UsuarioLojaOut, status_code=status.HTTP_201_CREATED)
async def criar_usuario(
    body: UsuarioLojaCreateIn,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    m: dict = Depends(require_role(UserRole.DONO, UserRole.GERENTE))
):
    current_user: Usuario = m["user"]
    current_role: UserRole = m["role"]

    if current_role == UserRole.GERENTE and body.role!= UserRole.VENDEDOR:
        raise HTTPException(status_code=403, detail="gerente só pode criar vendedor")

    # 1. Verifica se email já existe
    result = await db.execute(select(Usuario).where(Usuario.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="email já cadastrado")

    # 2. Cria Usuario na tabela global
    novo_user = Usuario(
        nome=body.nome,
        email=body.email,
        senha_hash=get_password_hash(body.senha),
        telefone=body.telefone,
        is_active=True
    )
    db.add(novo_user)
    await db.flush() # <- pra pegar o id

    # 3. Cria o vinculo UsuarioLoja
    vinculo = UsuarioLoja(
        usuario_id=novo_user.id,
        loja_id=loja_id,
        role=body.role,
        telefone=body.telefone,
        is_active=True
    )
    db.add(vinculo)
    await db.commit()
    await db.refresh(novo_user)

    return UsuarioLojaOut(
        id=novo_user.id, nome=novo_user.nome, email=novo_user.email,
        telefone=vinculo.telefone, role=vinculo.role, is_active=vinculo.is_active, loja_id=vinculo.loja_id
    )

@router.get("/me", response_model=UserRead)
async def ler_usuario_me(current_user: Usuario = Depends(get_current_user)):
    return UserRead.model_validate(current_user)

@router.get("", response_model=List[UsuarioLojaOut])
async def listar_usuarios(
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    m: dict = Depends(require_role(UserRole.DONO, UserRole.GERENTE))
):
    current_role: UserRole = m["role"]
    stmt = select(Usuario, UsuarioLoja).join(UsuarioLoja, Usuario.id == UsuarioLoja.usuario_id).where(
        UsuarioLoja.loja_id == loja_id,
        UsuarioLoja.is_active == True,
        Usuario.is_active == True
    )
    if current_role == UserRole.GERENTE:
        stmt = stmt.where(UsuarioLoja.role == UserRole.VENDEDOR)

    result = await db.execute(stmt)
    return [
        UsuarioLojaOut(
            id=u.id, nome=u.nome, email=u.email,
            telefone=ul.telefone, role=ul.role, is_active=ul.is_active, loja_id=ul.loja_id
        ) for u, ul in result.all()
    ]

@router.get("/{user_id}", response_model=UsuarioLojaOut)
async def ler_usuario(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    m: dict = Depends(require_role(UserRole.DONO, UserRole.GERENTE))
):
    stmt = select(Usuario, UsuarioLoja).join(UsuarioLoja, Usuario.id == UsuarioLoja.usuario_id).where(
        Usuario.id == user_id,
        UsuarioLoja.loja_id == loja_id,
        UsuarioLoja.is_active == True
    )
    res = (await db.execute(stmt)).first()
    if not res:
        raise HTTPException(status_code=404, detail="usuario não encontrado na loja")
    u, ul = res
    return UsuarioLojaOut(
        id=u.id, nome=u.nome, email=u.email,
        telefone=ul.telefone, role=ul.role, is_active=ul.is_active, loja_id=ul.loja_id
    )

@router.put("/{user_id}", response_model=UsuarioLojaOut)
async def atualizar_usuario(
    user_id: UUID,
    body: UsuarioLojaUpdateIn,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    m: dict = Depends(require_role(UserRole.DONO, UserRole.GERENTE))
):
    admin: Usuario = m["user"]
    role_atual: UserRole = m["role"]

    # Confirma senha do admin/dono que está fazendo a ação
    if not verify_password(body.senha_confirmacao, admin.senha_hash):
        raise HTTPException(status_code=403, detail="senha do administrador incorreta")

    stmt = select(Usuario, UsuarioLoja).join(UsuarioLoja, Usuario.id == UsuarioLoja.usuario_id).where(
        Usuario.id == user_id, UsuarioLoja.loja_id == loja_id
    )
    res = (await db.execute(stmt)).first()
    if not res:
        raise HTTPException(status_code=404, detail="usuario não encontrado na loja")

    u, ul = res
    if role_atual == UserRole.GERENTE and ul.role in [UserRole.GERENTE, UserRole.DONO]:
        raise HTTPException(status_code=403, detail="gerente não pode editar gerente ou dono")

    if body.nome is not None: u.nome = body.nome
    if body.telefone is not None:
        u.telefone = body.telefone
        ul.telefone = body.telefone
    if body.role is not None: ul.role = body.role
    if body.is_active is not None: ul.is_active = body.is_active

    await db.commit()
    await db.refresh(u)
    return UsuarioLojaOut(
        id=u.id, nome=u.nome, email=u.email,
        telefone=ul.telefone, role=ul.role, is_active=ul.is_active, loja_id=ul.loja_id
    )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_usuario(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    m: dict = Depends(require_role(UserRole.DONO, UserRole.GERENTE))
):
    stmt = select(UsuarioLoja).where(UsuarioLoja.usuario_id == user_id, UsuarioLoja.loja_id == loja_id)
    vinculo = (await db.execute(stmt)).scalar_one_or_none()
    if not vinculo:
        raise HTTPException(status_code=404, detail="usuario não encontrado nesta loja")

    if vinculo.usuario_id == m["user"].id:
        raise HTTPException(status_code=400, detail="você não pode se remover")
    if m["role"] == UserRole.GERENTE and vinculo.role in [UserRole.GERENTE, UserRole.DONO]:
        raise HTTPException(status_code=403, detail="gerente não pode remover gerente ou dono")

    vinculo.is_active = False # <- Soft delete
    await db.commit()
    return
