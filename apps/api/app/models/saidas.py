from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Numeric, DateTime, ForeignKey
from datetime import datetime
from decimal import Decimal
from uuid import UUID # <- FALTAVA ESSE
from..db.base import BaseModel
from typing import Optional

class Saida(BaseModel):
    __tablename__ = "saidas"

    loja_id: Mapped[UUID] = mapped_column(ForeignKey("lojas.id"), nullable=False, index=True)
    valor: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    descricao: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    data_saida: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
