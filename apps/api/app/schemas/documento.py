from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class DocumentoBase(BaseModel):
    nome: str
    tipo: str
    url: str
    status: str

class DocumentoCreate(BaseModel):
    tipo: str
    nome: str
    url: str

class DocumentoOut(DocumentoBase):
    id: UUID
    created_at: datetime
    nome_arquivo: str = Field(alias="nome") # <- FIX: Pega do `nome` do model

    class Config:
        from_attributes = True
        populate_by_name = True # <- Aceita tanto `nome` quanto `nome_arquivo`
