from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class ClienteBase(BaseModel):
    nome: str = Field(..., min_length=2)
    nome_empresa: Optional[str] = None
    bi: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    provincia: Optional[str] = None
    observacoes: Optional[str] = None
    is_active: bool = True

class ClienteCreate(ClienteBase):
    loja_id: UUID # <- troquei pra UUID

class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    nome_empresa: Optional[str] = None
    bi: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    provincia: Optional[str] = None
    observacoes: Optional[str] = None
    is_active: Optional[bool] = None

class ClienteOut(ClienteBase):
    id: UUID # <- troquei pra UUID
    loja_id: UUID # <- troquei pra UUID
    total_divida: float = 0.0
    ultima_compra: Optional[datetime] = None # <- MUDOU: agora pode ser null
    status: str = "em_dia" # 'com_divida' | 'em_dia'
    created_at: datetime

    class Config:
        from_attributes = True
