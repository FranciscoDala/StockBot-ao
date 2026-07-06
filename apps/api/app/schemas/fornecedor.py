from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class FornecedorBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=150)
    cnpj: Optional[str] = Field(None, max_length=20)
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    endereco: Optional[str] = Field(None, max_length=255)
    observacao: Optional[str] = None
    is_active: bool = True

class FornecedorCreate(FornecedorBase):
    loja_id: UUID

class FornecedorUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=150)
    cnpj: Optional[str] = Field(None, max_length=20)
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=100)
    endereco: Optional[str] = Field(None, max_length=255)
    observacao: Optional[str] = None
    is_active: Optional[bool] = None

class FornecedorOut(FornecedorBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    loja_id: UUID
    created_at: datetime
    updated_at: datetime
