from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional

class SaidaBase(BaseModel):
    valor: float = Field(gt=0, description="Valor da saída deve ser maior que 0")
    descricao: str = Field(default="Saída manual", max_length=255)

class SaidaCreate(SaidaBase):
    loja_id: UUID

class SaidaUpdate(BaseModel):
    valor: Optional[float] = Field(None, gt=0)
    descricao: Optional[str] = Field(None, max_length=255)

class SaidaRead(SaidaBase):
    id: UUID
    loja_id: UUID
    data_saida: datetime
    criado_por: Optional[UUID] = None

    class Config:
        from_attributes = True
