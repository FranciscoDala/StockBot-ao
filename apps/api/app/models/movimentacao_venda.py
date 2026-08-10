from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from..db.base import Base
import uuid
from datetime import datetime

class MovimentoVenda(Base):
    __tablename__ = "movimentos_vendas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venda_id = Column(UUID(as_uuid=True), ForeignKey("vendas.id", ondelete="CASCADE"), nullable=False)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)

    valor_pago = Column(Numeric(14, 2), nullable=False)
    forma_pagamento = Column(String(50), nullable=False) # Dinheiro, Transferencia, TPA
    observacao = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
