from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid

class MovimentacaoCaixa(Base):
    __tablename__ = "movimentacao_caixa"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    caixa_id = Column(UUID(as_uuid=True), ForeignKey("caixa.id", ondelete="CASCADE"), nullable=False)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)

    tipo = Column(String(20), nullable=False) # entrada, saida, sangria, abertura
    valor = Column(Numeric(14, 2), nullable=False)
    descricao = Column(Text, nullable=False)
    referencia_id = Column(UUID(as_uuid=True), nullable=True)
    referencia_tipo = Column(String(50), nullable=True)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    created_at = Column(TIMESTAMP(timezone=True), nullable=False)

    __table_args__ = (
        CheckConstraint("tipo IN ('entrada', 'saida', 'sangria', 'abertura')", name='ck_mov_tipo'),
    )
