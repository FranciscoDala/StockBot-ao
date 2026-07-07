from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID
from  app.models.role import UserRole

class UsuarioLojaCreateIn(BaseModel):
    nome: str = Field(min_length=2)
    email: EmailStr
    senha: str = Field(min_length=6)
    senha_confirmacao: str = Field(min_length=6)
    telefone: Optional[str] = None
    role: UserRole = UserRole.VENDEDOR
    @field_validator('senha_confirmacao')
    def passwords_match(cls, v, values):
        if 'senha' in values.data and v!= values.data['senha']:
            raise ValueError('as senhas não coincidem')
        return v

class UsuarioLojaUpdateIn(BaseModel):
    nome: Optional[str] = Field(None, min_length=2)
    telefone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    senha_confirmacao: str = Field(min_length=6)

class UsuarioLojaOut(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    telefone: Optional[str]
    role: UserRole
    is_active: bool
    loja_id: UUID
    class Config:
        from_attributes = True
