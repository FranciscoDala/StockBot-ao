from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
import uuid
from decimal import Decimal
from..db.base import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.venda import Venda
    from app.models.produto import Produto
    from app.models.loja import Loja

class ItemVenda(BaseModel):
    __tablename__ = "itens_venda"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    venda_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vendas.id", ondelete="CASCADE"), nullable=False)
    produto_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("produtos.id", ondelete="SET NULL"), nullable=True) # <- Mudei pra SET NULL
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False)

    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    preco_unitario: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False) # <- Padronizei com Venda
    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False) # <- Padronizei com Venda

    venda: Mapped["Venda"] = relationship(back_populates="itens")
    produto: Mapped["Produto | None"] = relationship(back_populates="itens_venda") # <- Pode ser None agora
    loja: Mapped["Loja"] = relationship()

    @property
    def nome_produto(self) -> str:
        """Campo que o Pydantic/Schema precisa pra serializar"""
        return self.produto.nome if self.produto else "Produto Removido"
