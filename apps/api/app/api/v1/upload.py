from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.core.deps import get_current_user
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "apps/api/uploads/produtos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/produto")
async def upload_imagem_produto(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")

    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/uploads/produtos/{filename}"}
