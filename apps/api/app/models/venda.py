from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Numeric, DateTime, func, Integer
from app.db.base import BaseModel 
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.loja import Loja
    from app.models.produto import Produto

class Venda(BaseModel):
    __tablename__ = "vendas"
    loja_id: Mapped[UUID] = mapped_column(ForeignKey("lojas.id"), nullable=False, index=True)
    usuario_id: Mapped[UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False, index=True)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="concluida", index=True)
    data_venda: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    loja: Mapped["Loja"] = relationship(back_populates="vendas")
    usuario: Mapped["Usuario"] = relationship(back_populates="vendas")
    itens: Mapped[List["ItemVenda"]] = relationship(back_populates="venda", cascade="all, delete-orphan")

class ItemVenda(BaseModel):
    __tablename__ = "itens_venda"
    venda_id: Mapped[UUID] = mapped_column(ForeignKey("vendas.id"), nullable=False, index=True)
    produto_id: Mapped[UUID] = mapped_column(ForeignKey("produtos.id"), nullable=False, index=True)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    venda: Mapped["Venda"] = relationship(back_populates="itens")
    produto: Mapped["Produto"] = relationship()