from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DocumentoBase(BaseModel):
    nome: str
    tipo: str
    url: str

class DocumentoCreate(DocumentoBase):
    pass

class DocumentoOut(DocumentoBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True