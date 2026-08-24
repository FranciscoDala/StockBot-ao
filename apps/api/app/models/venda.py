from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Numeric, DateTime, func, String, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from decimal import Decimal # <- ADICIONA ISSO
from..db.base import BaseModel
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.loja import Loja
    from app.models.usuario import Usuario
    from app.models.itens_venda import ItemVenda
    from app.models.cliente import Cliente
    from app.models.movimentacao_venda import MovimentoVenda

class Venda(BaseModel):
    __tablename__ = "vendas"

    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    cliente_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="SET NULL"), nullable=True, index=True)

    # VALORES - AGORA É DECIMAL
    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal(0)) # Total sem IVA
    valor_iva: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal(0)) # IVA 14%
    total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal(0)) # subtotal + iva
    total_itens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # PAGAMENTO
    forma_pagamento: Mapped[str] = mapped_column(String(50), nullable=False, default='Dinheiro')
    valor_recebido: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal(0))
    troco: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal(0))

    # STATUS
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='emitida') # emitida, anulada, divida
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # CAMPOS AGT
    tipo_documento: Mapped[str] = mapped_column(String(10), nullable=False, default='RECIBO') # RECIBO ou FACTURA
    serie: Mapped[str] = mapped_column(String(10), nullable=False, default="FT") # FT, TL, etc
    numero_fatura: Mapped[str | None] = mapped_column(String(50), nullable=True, unique=True, index=True) # Ex: FT 001/2026/000001
    qr_code_url: Mapped[str | None] = mapped_column(Text, nullable=True) # Link do QR Code gerado pela AGT

    # RELATIONSHIPS
    loja: Mapped["Loja"] = relationship("Loja", back_populates="vendas")
    usuario: Mapped["Usuario | None"] = relationship("Usuario", back_populates="vendas")
    cliente: Mapped["Cliente | None"] = relationship("Cliente", back_populates="vendas")
    itens: Mapped[List["ItemVenda"]] = relationship("ItemVenda", back_populates="venda", cascade="all, delete-orphan")
    movimentos: Mapped[List["MovimentoVenda"]] = relationship("MovimentoVenda", back_populates="venda", cascade="all, delete-orphan")
