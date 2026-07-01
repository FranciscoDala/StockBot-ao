from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from enum import Enum

class NivelUsuario(str, Enum):
    ADMIN = "admin"
    GERENTE = "gerente"
    VENDEDOR = "vendedor"

class UsuarioCreate(BaseModel):
    nome: str = Field(..., max_length=100)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    nivel: NivelUsuario = NivelUsuario.ADMIN

class UsuarioOut(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    nivel: NivelUsuario
    is_active: bool
    criado_em: datetime = Field(alias="created_at")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        json_encoders={UUID: str}
    )