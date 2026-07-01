from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Enum as SQLEnum
from api.app.db.base import BaseModel
import enum
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from api.app.models.loja import Loja
    from api.app.models.venda import Venda

class NivelUsuario(str, enum.Enum):
    ADMIN = "admin"
    GERENTE = "gerente"
    VENDEDOR = "vendedor"

class Usuario(BaseModel):
    __allow_unmapped__ = True
    __tablename__ = "usuarios"

    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False) # <- Nome certo
    nivel: Mapped[NivelUsuario] = mapped_column(
        SQLEnum(NivelUsuario, name="nivel_acesso", native_enum=False, create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=NivelUsuario.VENDEDOR,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    lojas_dono: Mapped[List["Loja"]] = relationship(back_populates="dono", foreign_keys="[Loja.usuario_id_dono]")
    lojas_gerente: Mapped[List["Loja"]] = relationship(back_populates="gerente", foreign_keys="[Loja.gerente_id]")
    vendas: Mapped[List["Venda"]] = relationship(back_populates="usuario")