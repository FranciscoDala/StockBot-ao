from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.venda import Venda
    from app.models.produto import Produto
    from app.models.loja import Loja

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
    loja: Mapped["Loja"] = relationship()

    # CAMPO PRA Pydantic ItemVendaRead
    @property
    def nome_produto(self) -> str:
        return self.produto.nome if self.produto else "Produto Removido"
