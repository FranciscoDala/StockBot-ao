from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, String, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from..db.base import BaseModel # <- Usa BaseModel pra pegar id, created_at, updated_at
import uuid

class MovimentoVenda(BaseModel): # <- Herdar do BaseModel
    __tablename__ = "movimentos_vendas"

    venda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendas.id", ondelete="CASCADE"), nullable=False, index=True)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)
    cliente_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="SET NULL")) # <- SET NULL igual migration
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"))

    valor_pago: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    forma_pagamento: Mapped[str] = mapped_column(String(50), nullable=False) # Dinheiro, Transferencia, TPA, Multicaixa
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relacionamentos opcionais
    venda: Mapped["Venda"] = relationship("Venda", back_populates="movimentos")
