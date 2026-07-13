from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List
import re # <- AJUSTE 1: faltava

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

    # 1. BUSCA NOME DA LOJA
    loja = await db.get(Loja, loja_id)
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")

    # 2. GERA EMAIL AUTOMATICO: primeiroNomeUsuario@primeiroNomeLoja.ao
    nome_usuario = body.nome.split()[0].lower()
    nome_loja = loja.nome.split()[0].lower()
    nome_usuario = re.sub(r'[^a-z0-9]', '', nome_usuario) # <- AJUSTE 2
    nome_loja = re.sub(r'[^a-z0-9]', '', nome_loja) # <- AJUSTE 2
    email_gerado = f"{nome_usuario}@{nome_loja}.ao"

    # 3. Verifica se email já existe. Se existir adiciona numero
    contador = 1
    email_final = email_gerado
    while True:
        result = await db.execute(select(Usuario).where(Usuario.email == email_final))
        if not result.scalar_one_or_none():
            break
        email_final = f"{nome_usuario}{contador}@{nome_loja}.ao"
        contador += 1

    # 4. Cria Usuario na tabela global - JÁ ESTAVA CERTO
    novo_user = Usuario(
        nome=body.nome,
        email=email_final, # <- USA O GERADO
        senha_hash=get_password_hash(body.senha), # <- HASH CORRETO
        telefone=body.telefone,
        is_active=True
    )
    db.add(novo_user)
    await db.flush()

    # 5. Cria o vinculo UsuarioLoja
    vinculo = UsuarioLoja(
        usuario_id=novo_user.id,
        loja_id=loja_id,
        role=body.role,
        telefone=body.telefone,
        is_active=True
    )
    db.add(vinculo)
    await db.commit()
    await db.refresh(vinculo) # <- CORRIGIDO
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
    senha_admin = getattr(body, 'senha_dono', getattr(body, 'senha_confirmacao', None))
    if not senha_admin or not verify_password(senha_admin, admin.senha_hash):
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

    # CORRIGIDO: Se veio senha nova, faz hash
    senha_nova = getattr(body, 'senha', None)
    if senha_nova:
        u.senha_hash = get_password_hash(senha_nova)

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
