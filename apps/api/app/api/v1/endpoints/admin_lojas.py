from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List
from pydantic import BaseModel, EmailStr
from typing import TYPE_CHECKING # <- ADD

from api.app.db.session import get_db
from api.app.schemas.loja import LojaRead, LojaUpdate
from api.app.models.usuario import Usuario, NivelUsuario
# from api.app.models.loja import Loja # <- REMOVIDO DO TOPO
from api.app.core.deps import require_nivel
from api.app.core.security import get_password_hash

if TYPE_CHECKING: # <- ADD
    from api.app.models.loja import Loja

router = APIRouter()

class LojaCreateComGerente(BaseModel):
    nome_loja: str
    slug: str
    gerente_nome: str
    gerente_email: EmailStr
    gerente_senha: str

@router.post("/", response_model=LojaRead, status_code=status.HTTP_201_CREATED)
async def create_loja_com_gerente(
    data_in: LojaCreateComGerente,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(require_nivel(NivelUsuario.ADMIN))
):
    # FIX: Importa aqui dentro pra evitar loop no startup
    from api.app.models.loja import Loja 

    result = await db.execute(select(Loja).where(Loja.slug == data_in.slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Slug já está em uso")

    result = await db.execute(select(Usuario).where(Usuario.email == data_in.gerente_email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email do gerente já está em uso")

    gerente_user = Usuario(
        nome=data_in.gerente_nome,
        email=data_in.gerente_email,
        senha_hash=get_password_hash(data_in.gerente_senha),
        nivel=NivelUsuario.GERENTE,
        ativo=True,
    )
    db.add(gerente_user)
    await db.commit()
    await db.refresh(gerente_user)

    loja = Loja(
        nome=data_in.nome_loja,
        slug=data_in.slug,
        usuario_id_dono=gerente_user.id
    )
    loja.usuarios.append(gerente_user)
    db.add(loja)
    await db.commit()
    await db.refresh(loja)
    return loja

@router.get("/", response_model=List[LojaRead])
async def list_lojas(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), _: Usuario = Depends(require_nivel(NivelUsuario.ADMIN))):
    from api.app.models.loja import Loja # <- FIX
    result = await db.execute(select(Loja).offset(skip).limit(limit).order_by(Loja.nome))
    return result.scalars().all()

@router.get("/{loja_id}", response_model=LojaRead)
async def get_loja(loja_id: UUID, db: AsyncSession = Depends(get_db), _: Usuario = Depends(require_nivel(NivelUsuario.ADMIN))):
    from api.app.models.loja import Loja # <- FIX
    loja = await db.get(Loja, loja_id)
    if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")
    return loja

@router.put("/{loja_id}", response_model=LojaRead)
async def update_loja(loja_id: UUID, loja_in: LojaUpdate, db: AsyncSession = Depends(get_db), _: Usuario = Depends(require_nivel(NivelUsuario.ADMIN))):
    from api.app.models.loja import Loja # <- FIX
    loja = await db.get(Loja, loja_id)
    if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")
    for key, value in loja_in.model_dump(exclude_unset=True).items():
        setattr(loja, key, value)
    await db.commit()
    await db.refresh(loja)
    return loja

@router.delete("/{loja_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_loja(loja_id: UUID, db: AsyncSession = Depends(get_db), _: Usuario = Depends(require_nivel(NivelUsuario.ADMIN))):
    from api.app.models.loja import Loja # <- FIX
    loja = await db.get(Loja, loja_id)
    if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")
    await db.delete(loja)
    await db.commit()