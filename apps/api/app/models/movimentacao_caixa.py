from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid
from datetime import datetime
import enum

class TipoMovimentacao(str, enum.Enum):
    ENTRADA = 'entrada'
    SAIDA = 'saida'
    SANGRIA = 'sangria'
    SUPRIMENTO = 'suprimento'

class MovimentacaoCaixa(Base):
    __tablename__ = "movimentacoes_caixa"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    caixa_id = Column(UUID(as_uuid=True), ForeignKey("caixa.id", ondelete="CASCADE"), nullable=False)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    saida_id = Column(UUID(as_uuid=True), ForeignKey("saidas.id"), nullable=True)

    tipo = Column(Enum(TipoMovimentacao), nullable=False)
    valor = Column(Numeric(14, 2), nullable=False)
    descricao = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
