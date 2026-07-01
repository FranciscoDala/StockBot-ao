from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class FuncionarioBase(BaseModel):
    cargo: str
    is_active: bool = True
    usuario_id: UUID

class FuncionarioCreate(FuncionarioBase):
    pass

class FuncionarioOut(FuncionarioBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True