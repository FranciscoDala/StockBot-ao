from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Enum as SQLEnum
from app.db.base import BaseModel 
import enum

from typing import TYPE_CHECKING
if TYPE_CHECKING: 
    from app.models.loja import Loja
    from app.models.venda import Venda

class NivelAcesso(str, enum.Enum):
    ADMIN = "admin"
    GERENTE = "gerente" 
    VENDEDOR = "vendedor"

class Usuario(BaseModel):
    __tablename__ = "usuarios"

    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    nivel: Mapped[NivelAcesso] = mapped_column(
        SQLEnum(NivelAcesso, name="nivel_acesso", native_enum=False, create_type=False),
        default=NivelAcesso.VENDEDOR, 
        nullable=False
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # FIX: 1 Usuario é dono de N Lojas. Aponta pro 'dono' do Loja
    lojas: Mapped[list["Loja"]] = relationship(back_populates="dono", cascade="all, delete-orphan")
    vendas: Mapped[list["Venda"]] = relationship(back_populates="usuario")