from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base

class TipoMovimentacao(str, enum.Enum):
    VENDA_DINHEIRO = "venda_dinheiro"
    SAIDA = "saida"
    SANGRIA = "sangria"
    ENTRADA = "entrada" # colocar dinheiro no caixa

class MovimentacaoCaixa(Base):
    __tablename__ = "movimentacoes_caixa"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    caixa_id = Column(UUID(as_uuid=True), ForeignKey("caixas.id"), nullable=False)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id"), nullable=False)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)

    tipo = Column(Enum(TipoMovimentacao), nullable=False)
    valor = Column(Numeric(10, 2), nullable=False) # sempre positivo
    descricao = Column(Text)

    venda_id = Column(UUID(as_uuid=True), ForeignKey("vendas.id"), nullable=True)
    saida_id = Column(UUID(as_uuid=True), ForeignKey("saidas.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    caixa = relationship("Caixa", back_populates="movimentacoes")
