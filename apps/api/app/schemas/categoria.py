from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class CategoriaBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = Field(None, max_length=50)
    descricao: Optional[str] = None
    is_active: bool = True

class CategoriaCreate(CategoriaBase):
    loja_id: UUID

class CategoriaUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    slug: Optional[str] = Field(None, max_length=50)
    descricao: Optional[str] = None
    is_active: Optional[bool] = None

class CategoriaOut(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    loja_id: UUID
    created_at: datetime
    updated_at: datetime
