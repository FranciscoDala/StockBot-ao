from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Any
from  app.models.role import UserRole

# ALIAS pra não quebrar código antigo que usa Role
Role = UserRole

class LojaSelectOut(BaseModel):
    id: UUID
    nome: str
    slug: str
    role: Role
    model_config = ConfigDict(from_attributes=True)

class UserRead(BaseModel):
    id: UUID
    nome: str
    email: EmailStr
    telefone: Optional[str] = None
    is_active: bool
    is_superuser: bool
    criado_em: datetime = Field(alias="created_at")

    nivel: Optional[str] = None
    role: Optional[str] = None
    loja_id: Optional[UUID] = None
    loja: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True, json_encoders={UUID: str})

class LoginResponse(BaseModel):
    access_token: str | None = None
    token_type: str = "bearer"
    need_selection: bool = False
    lojas: List[LojaSelectOut] = []
    user: UserRead | None = None

class UsuarioCreate(BaseModel):
    nome: str = Field(..., max_length=100)
    email: EmailStr
    senha: str = Field(..., min_length=6)
    telefone: Optional[str] = Field(None, max_length=20)

class LoginRequest(BaseModel):
    username: EmailStr
    password: str

# ALIAS pra não quebrar código antigo
userread = UserRead
usuariocreate = UsuarioCreate
logindata = LoginRequest
