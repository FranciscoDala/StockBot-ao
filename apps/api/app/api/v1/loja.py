from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload # <- 1. +selectinload pra listas
from typing import List
from uuid import UUID
from pydantic import BaseModel

from api.app.db.session import get_db
from api.app.models.usuario import Usuario, NivelUsuario
from api.app.models.loja import Loja
from api.app.core.deps import get_current_user
from api.app.schemas.loja import LojaCreate, LojaRead, LojaListRead, LojaDetailRead
from api.app.core.security import get_password_hash, verify_password

router = APIRouter()

class DeleteLojaRequest(BaseModel):
    senha: str

def require_admin_or_gerente(current_user: Usuario = Depends(get_current_user)):
    if current_user.nivel not in [NivelUsuario.ADMIN, NivelUsuario.GERENTE]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão. Só admin ou gerente.")
    return current_user

@router.get("", response_model=List[LojaListRead])
async def list_lojas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin_or_gerente)
):
    stmt = select(Loja).options(joinedload(Loja.gerente)).order_by(Loja.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

# 2. ROTA GET /lojas/{slug} - CORRIGIDA
@router.get("/{slug}", response_model=LojaDetailRead)
async def get_loja_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    stmt = select(Loja).options(
        joinedload(Loja.gerente),
        joinedload(Loja.dono),
        selectinload(Loja.documentos), # <- 3. Pra popular a tab Documentos
        selectinload(Loja.funcionarios), # <- 4. Pra contar total_funcionarios
        selectinload(Loja.vendas) # <- 5. Pra contar total_vendas_30d
    ).where(Loja.slug == slug)

    loja = (await db.execute(stmt)).scalar_one_or_none()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    return loja

@router.post("", response_model=LojaRead, status_code=status.HTTP_201_CREATED)
async def create_loja(
    loja_in: LojaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin_or_gerente),
):
    if not all([loja_in.gerente_email, loja_in.gerente_senha, loja_in.gerente_nome]):
        raise HTTPException(status_code=400, detail="Dados do gerente são obrigatórios")

    result = await db.execute(select(Usuario).where(Usuario.email == loja_in.gerente_email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Este email de gerente já existe")

    novo_gerente = Usuario(
        nome=loja_in.gerente_nome,
        email=loja_in.gerente_email,
        hashed_password=get_password_hash(loja_in.gerente_senha),
        nivel=NivelUsuario.GERENTE,
        is_active=True
    )
    db.add(novo_gerente)
    await db.flush()

    dados_loja = loja_in.model_dump(exclude={'gerente_nome', 'gerente_email', 'gerente_senha', 'usuario_id_dono'})
    nova_loja = Loja(**dados_loja, usuario_id_dono=current_user.id, gerente_id=novo_gerente.id)
    db.add(nova_loja)
    await db.commit()
    await db.refresh(nova_loja, attribute_names=['gerente'])
    return nova_loja

@router.put("/{loja_id}", response_model=LojaRead)
async def update_loja(
    loja_id: UUID,
    loja_in: LojaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin_or_gerente),
):
    stmt = select(Loja).options(joinedload(Loja.gerente)).where(Loja.id == loja_id)
    loja = (await db.execute(stmt)).scalar_one_or_none()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")

    update_data = loja_in.model_dump(exclude_unset=True, exclude={'gerente_nome', 'gerente_email', 'gerente_senha', 'usuario_id_dono'})
    for key, value in update_data.items():
        setattr(loja, key, value)

    if loja.gerente:
        if loja_in.gerente_nome: loja.gerente.nome = loja_in.gerente_nome
        if loja_in.gerente_email: loja.gerente.email = loja_in.gerente_email
        if loja_in.gerente_senha: loja.gerente.hashed_password = get_password_hash(loja_in.gerente_senha)

    await db.commit()
    await db.refresh(loja, attribute_names=['gerente'])
    return loja

@router.delete("/{loja_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loja(
    loja_id: UUID,
    body: DeleteLojaRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_admin_or_gerente),
):
    if not verify_password(body.senha, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Senha incorreta")

    stmt = select(Loja).where(Loja.id == loja_id)
    loja = (await db.execute(stmt)).scalar_one_or_none()
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")

    await db.delete(loja)
    await db.commit()
    return

@router.get("/me", response_model=LojaRead)
async def read_my_loja(db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    stmt = select(Loja).options(joinedload(Loja.gerente)).where(Loja.usuario_id_dono == current_user.id)
    loja = (await db.execute(stmt)).scalar_one_or_none()
    if not loja:
        raise HTTPException(status_code=404, detail="Cria uma loja primeiro")
    return loja