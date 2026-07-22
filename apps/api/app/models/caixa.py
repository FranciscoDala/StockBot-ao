from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Numeric, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class StatusCaixa(str, enum.Enum):
    ABERTO = "aberto"
    FECHADO = "fechado"

class Caixa(Base):
    __tablename__ = "caixas"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id"), nullable=False)
    data = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(Enum(StatusCaixa), default=StatusCaixa.ABERTO, nullable=False)

    saldo_abertura = Column(Numeric(10, 2), default=0)
    saldo_fechamento = Column(Numeric(10, 2), default=0)
    saldo_contado = Column(Numeric(10, 2), default=0) # o que foi contado na hora do fechamento
    diferenca = Column(Numeric(10, 2), default=0) # saldo_contado - saldo_fechamento

    usuario_abertura_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    usuario_fechamento_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))
    observacao = Column(String)

    fechado_em = Column(DateTime(timezone=True))

    loja = relationship("Loja")
    movimentacoes = relationship("MovimentacaoCaixa", back_populates="caixa", cascade="all, delete-orphan")
