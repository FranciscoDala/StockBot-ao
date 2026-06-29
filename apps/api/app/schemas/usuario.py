from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from uuid import UUID
import enum

class NivelAcesso(str, enum.Enum):
    ADMIN = "admin"
    GERENTE = "gerente" 
    VENDEDOR = "vendedor"

class UsuarioCreate(BaseModel):
    nome: str = Field(..., max_length=100)
    email: EmailStr
    senha: str = Field(..., min_length=6) # <- Usei 'senha' pra bater com o front
    nivel: NivelAcesso = NivelAcesso.VENDEDOR

class UsuarioOut(BaseModel): # <- ERA UsuarioRead, AGORA UsuarioOut
    id: UUID
    nome: str
    email: EmailStr
    nivel: NivelAcesso
    ativo: bool
    criado_em: datetime = Field(alias="created_at")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)