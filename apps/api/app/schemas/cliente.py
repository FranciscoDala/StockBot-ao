from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

class ClienteBase(BaseModel):
    nome: str = Field(..., min_length=2)
    nome_empresa: Optional[str] = None
    bi: Optional[str] = None
    nif: Optional[str] = None # <- ADICIONADO PRA AGT
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    provincia: Optional[str] = None
    observacoes: Optional[str] = None
    is_active: bool = True

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    nome_empresa: Optional[str] = None
    bi: Optional[str] = None
    nif: Optional[str] = None # <- ADICIONADO PRA AGT
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    provincia: Optional[str] = None
    observacoes: Optional[str] = None
    is_active: Optional[bool] = None

class ClienteOut(ClienteBase):
    id: str
    loja_id: str
    total_divida: float = 0.0
    ultima_compra: Optional[datetime] = None
    status: Literal['com_divida', 'em_dia'] = "em_dia"
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
