from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship # <- adiciona
from ..db.base import Base
import uuid

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False, index=True)

    nome = Column(String(255), nullable=False)
    nome_empresa = Column(String(255), nullable=True)
    bi = Column(String(50), nullable=True, index=True)
    telefone = Column(String(20), nullable=True, index=True)
    email = Column(String(255), nullable=True)
    endereco = Column(Text, nullable=True)
    cidade = Column(String(100), nullable=True)
    provincia = Column(String(100), nullable=True)
    observacoes = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # RELATIONSHIP PRA FECHAR O CICLO COM VENDA
    vendas = relationship("Venda", back_populates="cliente", cascade="all, delete-orphan")
