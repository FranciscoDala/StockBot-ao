from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Numeric, ForeignKey
from app.db.base import BaseModel
from uuid import UUID
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.venda import Venda
    from app.models.produto import Produto
    from app.models.loja import Loja

class ItemVenda(BaseModel):
    __tablename__ = "itens_venda"

    quantidade: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    preco_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    # CORREÇÃO FINAL: Mapped + Tipo + mapped_column
    venda_id: Mapped[UUID] = mapped_column(ForeignKey("vendas.id"), nullable=False, index=True)
    produto_id: Mapped[UUID] = mapped_column(ForeignKey("produtos.id"), nullable=False, index=True)
    loja_id: Mapped[UUID] = mapped_column(ForeignKey("lojas.id"), nullable=False, index=True)

    venda: Mapped["Venda"] = relationship(back_populates="itens")
    produto: Mapped["Produto"] = relationship(back_populates="itens_venda")
    loja: Mapped["Loja"] = relationship()