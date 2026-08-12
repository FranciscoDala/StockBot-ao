from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, Literal # <- importa Literal
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
    loja_id: str

    @field_validator('loja_id')
    @classmethod
    def validate_uuid(cls, v: str) -> UUID:
        return UUID(v)

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
    id: str
    loja_id: str
    total_divida: float = 0.0
    ultima_compra: Optional[datetime] = None
    status: Literal['com_divida', 'em_dia'] = "em_dia" # <- aqui
    created_at: datetime

    model_config = {
        "from_attributes": True
    }
