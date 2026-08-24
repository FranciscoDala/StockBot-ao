from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from..db.base import BaseModel
import uuid

class Cliente(BaseModel):
    __tablename__ = "clientes"

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

    # ADICIONADO AGT
    nif = Column(String(14), nullable=True, index=True) # <- NOVO CAMPO PRA FATURAR

    # ADICIONADO: Campo pra guardar a ultima compra fiada
    total_divida = Column(Float, default=0.0, nullable=False)
    ultima_compra = Column(DateTime(timezone=True), nullable=True)

    vendas = relationship("Venda", back_populates="cliente", cascade="all, delete-orphan")
