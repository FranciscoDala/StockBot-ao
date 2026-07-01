from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from api.app.db.base import BaseModel
from decimal import Decimal
from typing import TYPE_CHECKING, List
import uuid

if TYPE_CHECKING:
    from api.app.models.usuario import Usuario
    from api.app.models.loja import Loja
    from api.app.models.itens_venda import ItemVenda

class Venda(BaseModel):
    __tablename__ = "vendas"

    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id"), nullable=False, index=True)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False, index=True)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="concluida", index=True)
    # 1. REMOVIDO data_venda. Vamos usar o created_at do BaseModel

    loja: Mapped["Loja"] = relationship(back_populates="vendas")
    usuario: Mapped["Usuario"] = relationship(back_populates="vendas")
    itens: Mapped[List["ItemVenda"]] = relationship(back_populates="venda", cascade="all, delete-orphan")