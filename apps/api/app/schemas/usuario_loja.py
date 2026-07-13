from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID
from app.models.role import UserRole

class UsuarioLojaCreateIn(BaseModel):
    nome: str = Field(min_length=2)
    # email: EmailStr <- REMOVIDO, é automático
    senha: str = Field(min_length=6)
    senha_confirmacao: str = Field(min_length=6)
    telefone: Optional[str] = None
    role: UserRole = UserRole.VENDEDOR

    @field_validator('senha_confirmacao')
    def passwords_match(cls, v, info):
        senha = info.data.get('senha')
        if senha and v!= senha:
            raise ValueError('as senhas não coincidem')
        return v

class UsuarioLojaUpdateIn(BaseModel):
    nome: Optional[str] = Field(None, min_length=2)
    email: Optional[EmailStr] = None # <- pode editar email
    telefone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None # <- CORRIGIDO: tava faltando bool
    senha: Optional[str] = Field(None, min_length=6) # <- nova senha do usuario
    senha_dono: str = Field(min_length=6) # <- OBRIGATORIO pra confirmar a ação
    senha_confirmacao: Optional[str] = Field(None, min_length=6) # <- opcional, só valida se vier

    @field_validator('senha_confirmacao')
    def passwords_match_update(cls, v, info):
        senha = info.data.get('senha')
        if senha and v and v!= senha: # <- só valida se ambos vierem
            raise ValueError('as senhas não coincidem')
        return v

class UsuarioLojaOut(BaseModel):
    id: UUID
    nome: str
    email: EmailStr # <- CONTINUA SAINDO
    telefone: Optional[str]
    role: UserRole
    is_active: bool
    loja_id: UUID

    class Config:
        from_attributes = True
