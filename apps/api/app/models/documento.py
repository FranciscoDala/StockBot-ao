from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from api.app.db.base import BaseModel
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from api.app.models.loja import Loja

class DocumentoKYC(BaseModel):
    __tablename__ = "documentos_kyc"

    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id"), nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False) # NIF, ALVARA, CONTRATO
    url: Mapped[str] = mapped_column(String(500), nullable=False)

    loja: Mapped["Loja"] = relationship(back_populates="documentos")