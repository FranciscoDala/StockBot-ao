from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from  ..db.base import Base
import uuid

class Saida(Base):
    __tablename__ = "saidas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False, index=True)

    valor = Column(Float, nullable=False)
    descricao = Column(String(255), nullable=False, default="Saída manual")

    data_saida = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    criado_por = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True) # quem registrou
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
