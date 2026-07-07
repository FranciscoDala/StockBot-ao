from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Path as PathParam, Form, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import shutil
import os
from pathlib import Path
import logging
import traceback
from pydantic import BaseModel

from  app.db.session import get_db
from  app.core.deps import get_current_user, require_role, get_current_loja_id # <- FIX
from  app.models.usuario import Usuario # <- FIX: Tirei NivelUsuario
from  app.models.documento import DocumentoKYC
from  app.schemas.usuario import Role # <- FIX
from  app.core.security import verify_password

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = Path("uploads/kyc")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

class DeleteDocSchema(BaseModel):
    senha: str

# <- FIX: Apaguei require_admin_or_loja_owner. Agora o token já garante a loja.

@router.get("/documentos", dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))]) # <- FIX: Sem loja_id na URL
async def listar_documentos_kyc(
    db: AsyncSession = Depends(get_db),
    loja_id: uuid.UUID = Depends(get_current_loja_id) # <- FIX: Pega do token
):
    result = await db.execute(select(DocumentoKYC).where(DocumentoKYC.loja_id == loja_id)) # <- Blindagem
    docs = result.scalars().all()
    return docs

@router.post("/documentos", dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))]) # <- FIX
async def upload_documento_kyc(
    tipo: str = Form("OUTRO"),
    nome: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    loja_id: uuid.UUID = Depends(get_current_loja_id) # <- FIX: Pega do token
):
    try:
        logger.info(f"UPLOAD RECEBIDO: loja_id={loja_id} tipo={tipo} file={file.filename} size={file.size}")

        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-")
        filename = f"{loja_id}_{uuid.uuid4().hex}_{safe_filename}"
        file_path = UPLOAD_DIR / filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_url = f"/uploads/kyc/{filename}"

        doc = DocumentoKYC(
            loja_id=loja_id, # <- FIX: Amarra no token
            tipo=tipo,
            nome=nome,
            url=file_url,
            status="pendente"
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

        return doc

    except Exception as e:
        logger.error(f"ERRO NO UPLOAD: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documentos/{doc_id}", dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))]) # <- FIX
async def apagar_documento_kyc(
    doc_id: uuid.UUID = PathParam(...),
    payload: DeleteDocSchema = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id: uuid.UUID = Depends(get_current_loja_id) # <- FIX
):
    if not verify_password(payload.senha, current_user.hashed_password):
        raise HTTPException(status_code=403, detail="Senha incorreta")

    result = await db.execute(select(DocumentoKYC).where(DocumentoKYC.id == doc_id, DocumentoKYC.loja_id == loja_id)) # <- Blindagem
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado nesta loja")

    file_path = Path(".") / doc.url.lstrip("/")
    if file_path.exists():
        os.remove(file_path)

    await db.delete(doc)
    await db.commit()

    return {"ok": True, "detail": "Documento apagado"}
