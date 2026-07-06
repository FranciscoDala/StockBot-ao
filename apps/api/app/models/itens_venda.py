from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
import uuid
from api.app.db.base import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from api.app.models.venda import Venda
    from api.app.models.produto import Produto
    from api.app.models.loja import Loja

class ItemVenda(BaseModel):
    __tablename__ = "itens_venda"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendas.id", ondelete="CASCADE"), nullable=False)
    produto_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("produtos.id", ondelete="RESTRICT"), nullable=False)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)

    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    preco_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    venda: Mapped["Venda"] = relationship(back_populates="itens")
    produto: Mapped["Produto"] = relationship(back_populates="itens_venda")
    loja: Mapped["Loja"] = relationship() # <- FK já resolve o join
