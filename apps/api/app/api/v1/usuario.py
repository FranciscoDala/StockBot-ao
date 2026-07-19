from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List
import re

from app.db.session import get_db
from app.schemas.usuario import UserRead
from app.schemas.usuario_loja import UsuarioLojaCreateIn, UsuarioLojaUpdateIn, UsuarioLojaOut
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from app.models.loja import Loja
from app.core.deps import require_role, get_current_user
from app.core.security import get_password_hash, verify_password
from app.models.role import UserRole

router = APIRouter(prefix="/lojas/id/{loja_id}/usuarios", tags=["usuarios"])

def _check_dono_password(admin: Usuario, senha_dono: str, senha_confirmacao: str):
    if not senha_dono or not senha_confirmacao:
        raise HTTPException(status_code=403, detail="Senha do administrador e confirmação obrigatórias")
    if senha_dono!= senha_confirmacao:
        raise HTTPException(status_code=403, detail="Senha e confirmação não conferem")
    if not verify_password(senha_dono, admin.senha_hash):
        raise HTTPException(status_code=403, detail="Senha do administrador incorreta")

@router.post("", response_model=UsuarioLojaOut, status_code=status.HTTP_201_CREATED)
async def criar_usuario(
    loja_id: UUID,
    body: UsuarioLojaCreateIn,
    db: AsyncSession = Depends(get_db),
    m: dict = Depends(require_role(UserRole.DONO, UserRole.GERENTE))
):
    current_user: Usuario = m["user"]
    current_role: UserRole = m["role"]

    # 0. VALIDA SENHA DO DONO SEMPRE
    _check_dono_password(current_user, body.senha_dono, body.senha_confirmacao)

    # 1. REGRA DE PERMISSÃO
    if current_role == UserRole.GERENTE and body.role!= UserRole.VENDEDOR:
        raise HTTPException(status_code=403, detail="gerente só pode criar vendedor")
    if current_role == UserRole.DONO and body.role == UserRole.DONO:
        raise HTTPException(status_code=403, detail="não é possível criar outro dono")

    # 2. BUSCA NOME DA LOJA
    loja = await db.get(Loja, loja_id)
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")

    # 3. GERA EMAIL AUTOMATICO: primeiroNomeUsuario@primeiroNomeLoja.ao
    nome_usuario = body.nome.split()[0].lower()
    nome_loja = loja.nome.split()[0].lower()
    nome_usuario = re.sub(r'[^a-z0-9]', '', nome_usuario)
    nome_loja = re.sub(r'[^a-z0-9]', '', nome_loja)

    if not nome_usuario: nome_usuario = "usuario"
    if not nome_loja: nome_loja = "loja"

    email_gerado = f"{nome_usuario}@{nome_loja}.ao"

    # 4. Verifica se email já existe
    contador = 1
    email_final = email_gerado
    while True:
        result = await db.execute(select(Usuario).where(Usuario.email == email_final))
        if not result.scalar_one_or_none():
            break
        email_final = f"{nome_usuario}{contador}@{nome_loja}.ao"
        contador += 1
        if contador > 100:
            raise HTTPException(status_code=400, detail="não foi possível gerar email único")

    # 5. Valida se senha e confirmação batem
    if body.senha!= body.senha_confirmacao:
        raise HTTPException(status_code=400, detail="as senhas não coincidem")

    # 6. Cria Usuario na tabela global
    novo_user = Usuario(
        nome=body.nome,
        email=email_final,
        senha_hash=get_password_hash(body.senha),
        telefone=body.telefone,
        is_active=True
    )
    db.add(novo_user)
    await db.flush()

    # 7. Cria o vinculo UsuarioLoja
    vinculo = UsuarioLoja(
        usuario_id=novo_user.id,
        loja_id=loja_id,
        role=body.role,
        telefone=body.telefone,
        is_active=True
    )
    db.add(vinculo)
    await db.commit()
    await db.refresh(vinculo)
    await db.refresh(novo_user)

    return UsuarioLojaOut.model_validate({**novo_user.__dict__, **vinculo.__dict__, "loja_id": vinculo.loja_id})

@router.get("/me", response_model=UserRead)
async def ler_usuario_me(current_user: Usuario = Depends(get_current_user)):
    return UserRead.model_validate(current_user)

@router.get("", response_model=List[UsuarioLojaOut])
async def listar_usuarios(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
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
        UsuarioLojaOut.model_validate({
            "id": ul.usuario_id,
            "nome": u.nome,
            "email": u.email,
            "telefone": ul.telefone or u.telefone,
            "role": ul.role,
            "is_active": ul.is_active,
            "loja_id": ul.loja_id,
            "usuario_id": ul.usuario_id
        })
        for u, ul in result.all()
    ]


@router.get("/{user_id}", response_model=UsuarioLojaOut)
async def ler_usuario(
    loja_id: UUID,
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
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
    return UsuarioLojaOut.model_validate({**u.__dict__, **ul.__dict__, "loja_id": ul.loja_id})

@router.put("/{user_id}", response_model=UsuarioLojaOut)
async def atualizar_usuario(
    loja_id: UUID,
    user_id: UUID,
    body: UsuarioLojaUpdateIn,
    db: AsyncSession = Depends(get_db),
    m: dict = Depends(require_role(UserRole.DONO, UserRole.GERENTE))
):
    admin: Usuario = m["user"]
    role_atual: UserRole = m["role"]

    # 0. VALIDA SENHA DO DONO SEMPRE PRA EDITAR
    _check_dono_password(admin, body.senha_dono, body.senha_confirmacao)

    stmt = select(Usuario, UsuarioLoja).join(UsuarioLoja, Usuario.id == UsuarioLoja.usuario_id).where(
        Usuario.id == user_id, UsuarioLoja.loja_id == loja_id
    )
    res = (await db.execute(stmt)).first()
    if not res:
        raise HTTPException(status_code=404, detail="usuario não encontrado na loja")

    u, ul = res
    if role_atual == UserRole.GERENTE and ul.role in [UserRole.GERENTE, UserRole.DONO]:
        raise HTTPException(status_code=403, detail="gerente não pode editar gerente ou dono")

    # 1. Atualiza campos APENAS SE VIERAM
    if body.nome is not None and body.nome.strip(): u.nome = body.nome
    if body.email is not None and body.email!= u.email:
        result = await db.execute(select(Usuario).where(Usuario.email == body.email, Usuario.id!= u.id))
        if result.scalar_one_or_none(): raise HTTPException(status_code=400, detail="Este email já está em uso")
        u.email = body.email
    if body.telefone is not None:
        u.telefone = body.telefone
        ul.telefone = body.telefone
    if body.role is not None: ul.role = body.role # <- AGORA VAI MUDAR O CARGO
    if body.is_active is not None: ul.is_active = body.is_active
    if body.senha and body.senha.strip(): u.senha_hash = get_password_hash(body.senha)

    await db.commit()
    await db.refresh(u)
    await db.refresh(ul)
    return UsuarioLojaOut.model_validate({**u.__dict__, **ul.__dict__, "loja_id": ul.loja_id})

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_usuario(
    loja_id: UUID,
    user_id: UUID,
    payload: dict = Body(...), # <- CORRIGIDO: pega json normal
    db: AsyncSession = Depends(get_db),
    m: dict = Depends(require_role(UserRole.DONO, UserRole.GERENTE))
):
    admin: Usuario = m["user"]
    role_atual: UserRole = m["role"]

    # 0. VALIDA SENHA DO DONO SEMPRE PRA APAGAR
    _check_dono_password(admin, payload.get("senha_dono"), payload.get("senha_confirmacao"))

    stmt = select(UsuarioLoja).where(UsuarioLoja.usuario_id == user_id, UsuarioLoja.loja_id == loja_id)
    vinculo = (await db.execute(stmt)).scalar_one_or_none()
    if not vinculo:
        raise HTTPException(status_code=404, detail="usuario não encontrado nesta loja")

    if vinculo.usuario_id == admin.id:
        raise HTTPException(status_code=400, detail="você não pode se remover")
    if role_atual == UserRole.GERENTE and vinculo.role in [UserRole.GERENTE, UserRole.DONO]:
        raise HTTPException(status_code=403, detail="gerente não pode remover gerente ou dono")

    vinculo.is_active = False # Soft delete
    await db.commit()
    return
