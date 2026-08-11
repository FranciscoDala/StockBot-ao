from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Numeric, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from..db.base import Base # <- MUDA: usa Base em vez de BaseModel
import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.venda import Venda

class MovimentoVenda(Base): # <- MUDA AQUI: Base em vez de BaseModel
    __tablename__ = "movimentos_vendas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False) # <- Adiciona manual

    venda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendas.id", ondelete="CASCADE"), nullable=False, index=True)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)
    cliente_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="SET NULL"))
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"))

    valor_pago: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    forma_pagamento: Mapped[str] = mapped_column(String(50), nullable=False)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relacionamentos
    venda: Mapped["Venda"] = relationship("Venda", back_populates="movimentos")
