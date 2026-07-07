from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Numeric, DateTime, func, String, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from  app.db.base import BaseModel
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from  app.models.loja import Loja
    from  app.models.usuario import Usuario
    from  app.models.itens_venda import ItemVenda

class Venda(BaseModel):
    __tablename__ = "vendas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    # NOVOS CAMPOS
    total_itens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    forma_pagamento: Mapped[str] = mapped_column(String(50), nullable=False, default='Dinheiro')
    valor_recebido: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    troco: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='concluida')

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    loja: Mapped["Loja"] = relationship(back_populates="vendas")
    usuario: Mapped["Usuario"] = relationship(back_populates="vendas")
    itens: Mapped[List["ItemVenda"]] = relationship(back_populates="venda", cascade="all, delete-orphan")
