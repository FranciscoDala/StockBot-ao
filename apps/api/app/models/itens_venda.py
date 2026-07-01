from __future__ import annotations

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from api.app.db.base import BaseModel 
import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from api.app.models.venda import Venda
    from api.app.models.produto import Produto
    from api.app.models.loja import Loja

class ItemVenda(BaseModel):
    __tablename__ = "itens_venda"

    venda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendas.id"), nullable=False, index=True)
    produto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("produtos.id"), nullable=False, index=True)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id"), nullable=False, index=True)

    quantidade: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    preco_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    venda: Mapped["Venda"] = relationship(back_populates="itens")
    produto: Mapped["Produto"] = relationship(back_populates="itens_venda")
    loja: Mapped["Loja"] = relationship()