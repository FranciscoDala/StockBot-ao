from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from api.app.db.base import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from api.app.models.loja import Loja
    from api.app.models.produto import Produto

class Fornecedor(BaseModel):
    __tablename__ = "fornecedores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)

    loja: Mapped["Loja"] = relationship(back_populates="fornecedores")
    produtos: Mapped[list["Produto"]] = relationship(back_populates="fornecedor")
