from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from api.app.db.base import BaseModel
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from api.app.models.loja import Loja
    from api.app.models.usuario import Usuario

class Funcionario(BaseModel):
    __tablename__ = "funcionarios"

    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id"), nullable=False, index=True)
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    cargo: Mapped[str] = mapped_column(String(50), nullable=False, default="Operador")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    loja: Mapped["Loja"] = relationship(back_populates="funcionarios")
    usuario: Mapped["Usuario"] = relationship()