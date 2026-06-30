from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from app.db.base import BaseModel
from uuid import UUID
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.produto import Produto
    from app.models.venda import Venda

class Loja(BaseModel):
    __tablename__ = "lojas"

    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

    usuario_id_dono: Mapped[UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)

    # FIX: 1 Loja tem 1 Dono. Aponta pra lista 'lojas' do Usuario
    dono: Mapped["Usuario"] = relationship(back_populates="lojas")
    produtos: Mapped[List["Produto"]] = relationship(back_populates="loja", cascade="all, delete-orphan")
    vendas: Mapped[List["Venda"]] = relationship(back_populates="loja", cascade="all, delete-orphan")