from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey, Date, Text, CheckConstraint, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base
import uuid
from datetime import date
import enum # <- ADICIONA

class StatusCaixa(str, enum.Enum): # <- ADICIONA ISSO
    ABERTO = 'aberto'
    FECHADO = 'fechado'

class Caixa(Base):
    __tablename__ = "caixa"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)
    data_caixa = Column(Date, nullable=False, default=date.today)
    data_abertura = Column(TIMESTAMP(timezone=True), nullable=False)
    data_fechamento = Column(TIMESTAMP(timezone=True), nullable=True)
    usuario_abertura_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    usuario_fechamento_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))

    saldo_abertura = Column(Numeric(14, 2), default=0.00, nullable=False)
    total_entradas = Column(Numeric(14, 2), default=0.00, nullable=False)
    total_saidas = Column(Numeric(14, 2), default=0.00, nullable=False)
    saldo_esperado = Column(Numeric(14, 2), default=0.00, nullable=False)
    saldo_contado = Column(Numeric(14, 2), nullable=True)
    diferenca = Column(Numeric(14, 2), nullable=True)

    status = Column(Enum(StatusCaixa), default=StatusCaixa.ABERTO, nullable=False) # <- TROCA AQUI
    observacao = Column(Text)

    # Pode tirar o CheckConstraint agora
