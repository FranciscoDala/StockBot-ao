from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Numeric, Integer, ForeignKey
from app.db.base import BaseModel
from uuid import UUID
from decimal import Decimal
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from app.models.loja import Loja
    from app.models.item_venda import ItemVenda

class Produto(BaseModel):
    __tablename__ = "produtos"

    nome: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    preco: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    estoque: Mapped[int] = mapped_column(Integer, default=0, nullable=False) # <- Bate com teu DB
    
    loja_id: Mapped[UUID] = mapped_column(ForeignKey("lojas.id"), nullable=False, index=True) # <- CORRIGIDO: Era só `Mapped`
    
    # Relacionamentos
    loja: Mapped["Loja"] = relationship(back_populates="produtos")
    itens_venda: Mapped[List["ItemVenda"]] = relationship(back_populates="produto", cascade="all, delete-orphan")