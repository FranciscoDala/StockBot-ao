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
    senha_dono: str = Field(min_length=1) # <- diminui pra 1 pq pode ser "1234"
    senha_confirmacao_dono: str = Field(min_length=1) # <- ADICIONEI PRA BATER COM O FRONT

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
    is_active: Optional = None
    senha: Optional[str] = Field(None, min_length=6)
    senha_dono: str = Field(min_length=1) # <- OBRIGATORIO
    senha_confirmacao: str = Field(min_length=1) # <- OBRIGATORIO PRA BATER COM O FRONT

    @field_validator('senha_confirmacao')
    def passwords_match_update(cls, v, info):
        senha = info.data.get('senha')
        senha_dono = info.data.get('senha_dono')
        if senha and v!= senha:
            raise ValueError('as senhas não coincidem')
        if senha_dono and v!= senha_dono and not senha: # se só mandou senha_dono
             pass # deixa passar
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
