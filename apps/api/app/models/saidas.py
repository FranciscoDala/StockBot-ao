import uuid
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.base import Base

class Saida(Base):
    __tablename__ = "saidas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id"), nullable=False, index=True)
    descricao = Column(String, nullable=True)
    valor = Column(Numeric(10, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    loja = relationship("Loja", back_populates="saidas")
