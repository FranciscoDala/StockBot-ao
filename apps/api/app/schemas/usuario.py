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
    senha: str = Field(..., min_length=6) 
    nivel: NivelAcesso = NivelAcesso.VENDEDOR

class UsuarioOut(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    nivel: NivelAcesso
    ativo: bool
    criado_em: datetime = Field(alias="created_at") # <- 1. CORRIGIDO: Mapeia created_at do DB -> criado_em no JSON

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True, # <- 2. CORRIGIDO: Obrigatório pra alias funcionar
        json_encoders={UUID: str} # <- 3. CORRIGIDO: Serializa UUID pra str e mata o 'UUID input should be a string'
    )