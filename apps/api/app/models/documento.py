from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, DateTime, func, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime
from api.app.db.base import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from api.app.models.loja import Loja

class TipoDocumento(enum.Enum):
    bi = "bi"
    alvara = "alvara"
    certificado = "certificado"

tipo_doc_enum = SQLEnum(TipoDocumento, name="tipo_documento_enum", native_enum=False, values_callable=lambda x: [e.value for e in x])

class StatusKYC(enum.Enum):
    pendente = "pendente"
    aprovado = "aprovado"
    reprovado = "reprovado"

status_enum = SQLEnum(StatusKYC, name="status_kyc_enum", native_enum=False, values_callable=lambda x: [e.value for e in x])

class DocumentoKYC(BaseModel):
    __tablename__ = "documentos_kyc"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False) # <- FIX: ForeignKey pra lojas
    tipo: Mapped[TipoDocumento] = mapped_column(tipo_doc_enum, nullable=False)
    url_arquivo: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[StatusKYC] = mapped_column(status_enum, default=StatusKYC.pendente, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    loja: Mapped["Loja"] = relationship(back_populates="documentos") # <- FIX: bate com Loja.documentos
