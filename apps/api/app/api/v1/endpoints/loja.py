import os
import shutil
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from api.app.db.session import get_db
from api.app.core.deps import get_current_membership, get_current_user # <- IMPORT CORRIGIDO
from api.app.crud import crud_documento, loja
from api.app.schemas.documento import DocumentoOut, DocumentoCreate
from api.app.models.usuario import Usuario
from api.app.models.loja import Loja
from api.app.models.usuario_loja import UsuarioLoja
from api.app.models.role import UserRole
from pathlib import Path

router = APIRouter()
UPLOAD_DIR = Path("uploads/lojas")

@router.get("/minhas")
async def listar_minhas_lojas(
    db: AsyncSession = Depends(get_db),
    m = Depends(get_current_membership) # <- USA MEMBERSHIP PRA ACEITAR MULTI_LOJA
):
    current_user = m["user"]
    if current_user.is_superuser:
        stmt = select(Loja).where(Loja.is_active == True).order_by(Loja.nome)
        result = await db.execute(stmt)
        lojas = result.scalars().all()
    else:
        stmt = select(Loja).join(UsuarioLoja).where(
            UsuarioLoja.usuario_id == current_user.id,
            UsuarioLoja.is_active == True,
            Loja.is_active == True
        ).order_by(Loja.nome)
        result = await db.execute(stmt)
        lojas = result.scalars().all()

    return [
        {"id": str(l.id), "nome": l.nome, "slug": l.slug, "is_active": l.is_active, "created_at": l.created_at}
        for l in lojas
    ]

async def check_loja_permission(db: AsyncSession, user: Usuario, loja_id: UUID):
    if user.is_superuser:
        return True
    stmt = select(UsuarioLoja).where(UsuarioLoja.usuario_id == user.id, UsuarioLoja.loja_id == loja_id, UsuarioLoja.is_active == True)
    return (await db.execute(stmt)).scalar_one_or_none() is not None

@router.get("/{loja_id}/documentos", response_model=list[DocumentoOut])
async def listar_documentos(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
    m = Depends(get_current_membership) # <- USA MEMBERSHIP PRA VALIDAR LOJA
):
    current_user = m["user"]
    # se já tiver loja no token, valida se é a mesma
    if m["loja_id"] and m["loja_id"]!= loja_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Sem permissão para esta loja")

    stmt = select(Loja).where(Loja.id == loja_id)
    loja_db = (await db.execute(stmt)).scalar_one_or_none()
    if not loja_db:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    if not await check_loja_permission(db, current_user, loja_id):
        raise HTTPException(status_code=403, detail="Sem permissão")

    docs = await crud_documento.get_by_loja(db, loja_id=loja_id)
    return [{"id": d.id, "tipo": d.tipo, "url": d.url, "status": d.status, "created_at": d.created_at, "nome": d.nome, "nome_arquivo": d.nome} for d in docs]

@router.post("/{loja_id}/documentos", response_model=DocumentoOut)
async def upload_documento(
    loja_id: UUID,
    tipo: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    m = Depends(get_current_membership) # <- USA MEMBERSHIP PRA VALIDAR LOJA
):
    current_user = m["user"]
    if m["loja_id"] and m["loja_id"]!= loja_id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Sem permissão para esta loja")

    stmt = select(Loja).where(Loja.id == loja_id)
    loja_db = (await db.execute(stmt)).scalar_one_or_none()
    if not loja_db:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    if not await check_loja_permission(db, current_user, loja_id):
        raise HTTPException(status_code=403, detail="Sem permissão")

    loja_dir = UPLOAD_DIR / str(loja_id)
    loja_dir.mkdir(parents=True, exist_ok=True)
    file_path = loja_dir / file.filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    url = f"/{file_path.as_posix()}"
    obj_in = DocumentoCreate(tipo=tipo, nome=file.filename, url=url)
    doc = await crud_documento.create(db, loja_id=loja_id, obj_in=obj_in)

    return {"id": doc.id, "tipo": doc.tipo, "url": doc.url, "status": doc.status, "created_at": doc.created_at, "nome": doc.nome, "nome_arquivo": doc.nome}
