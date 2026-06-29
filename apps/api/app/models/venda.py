from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey, Numeric, DateTime, func
from datetime import datetime
from decimal import Decimal
from typing import List
from app.db.base import Base # <- Muda pra base.py. session.py é só pra db.

class Venda(Base):
    __tablename__ = "vendas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    status: Mapped[str] = mapped_column(String(20), nullable=False, default="concluida", index=True)
    # status: 'concluida' | 'estornada'

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="vendas")
    itens: Mapped[List["ItemVenda"]] = relationship("ItemVenda", back_populates="venda", cascade="all, delete-orphan")

class ItemVenda(Base):
    __tablename__ = "itens_venda"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    venda_id: Mapped[int] = mapped_column(ForeignKey("vendas.id"), nullable=False)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False) # <- Decimal, não Float
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False) # <- Decimal, não Float

    venda: Mapped["Venda"] = relationship("Venda", back_populates="itens")
    produto: Mapped["Produto"] = relationship("Produto")