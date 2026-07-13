from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from uuid import UUID
from app.models.role import UserRole

class UsuarioLojaCreateIn(BaseModel):
    nome: str = Field(min_length=2)
    senha: str = Field(min_length=6)
    senha_confirmacao: str = Field(min_length=6)
    telefone: Optional[str] = None
    role: UserRole = UserRole.VENDEDOR
    senha_dono: str = Field(min_length=1)
    senha_confirmacao_dono: str = Field(min_length=1) # <- pra bater com o front

    @field_validator('senha_confirmacao')
    def passwords_match(cls, v, info):
        senha = info.data.get('senha')
        if senha and v!= senha:
            raise ValueError('as senhas não coincidem')
        return v

    @field_validator('senha_confirmacao_dono')
    def dono_passwords_match(cls, v, info):
        senha_dono = info.data.get('senha_dono')
        if senha_dono and v!= senha_dono:
            raise ValueError('senha do dono e confirmação não conferem')
        return v

class UsuarioLojaUpdateIn(BaseModel):
    nome: Optional[str] = Field(None, min_length=2)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None # <- CORRIGIDO: tinha que ter [bool]
    senha: Optional[str] = Field(None, min_length=6)
    senha_dono: str = Field(min_length=1) # <- OBRIGATORIO
    senha_confirmacao: str = Field(min_length=1) # <- OBRIGATORIO

    @field_validator('senha_confirmacao')
    def passwords_match_update(cls, v, info):
        senha = info.data.get('senha')
        senha_dono = info.data.get('senha_dono')

        # valida senha do usuario se veio
        if senha and v!= senha:
            raise ValueError('as senhas não coincidem')

        # valida senha do dono
        if senha_dono and v!= senha_dono:
            raise ValueError('senha do dono e confirmação não conferem')
        return v

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
