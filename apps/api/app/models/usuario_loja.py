from __future__ import annotations
import uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import BaseModel
from app.models.role import UserRole
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.models.usuario import Usuario
    from app.models.loja import Loja

class UsuarioLoja(BaseModel):
    __tablename__ = "usuarios_lojas"
    usuario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id", ondelete="CASCADE"), primary_key=True)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), primary_key=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="userrole"), nullable=False, default=UserRole.VENDEDOR)
    cargo: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    telefone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    usuario: Mapped["Usuario"] = relationship(back_populates="lojas")
    loja: Mapped["Loja"] = relationship(back_populates="membros")
