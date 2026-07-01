from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from api.app.db.base import BaseModel
from typing import TYPE_CHECKING, List, Optional
import uuid

if TYPE_CHECKING:
    from api.app.models.usuario import Usuario
    from api.app.models.produto import Produto
    from api.app.models.venda import Venda
    from api.app.models.documento import DocumentoKYC # <- 1. Novo
    from api.app.models.funcionario import Funcionario # <- 2. Novo

class Loja(BaseModel):
    __allow_unmapped__ = True
    __tablename__ = "lojas"

    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # 3. CAMPOS PRA BATER COM O FRONT
    endereco: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # -> localizacao
    logo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ano_fundacao: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # -> ano_fundacao

    usuario_id_dono: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)

    dono: Mapped["Usuario"] = relationship(back_populates="lojas_dono", foreign_keys=[usuario_id_dono])
    gerente_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    gerente: Mapped[Optional["Usuario"]] = relationship(back_populates="lojas_gerente", foreign_keys=[gerente_id])

    produtos: Mapped[List["Produto"]] = relationship(back_populates="loja", cascade="all, delete-orphan")
    vendas: Mapped[List["Venda"]] = relationship(back_populates="loja", cascade="all, delete-orphan")

    # 4. RELATIONSHIPS NOVAS PRA PAGE
    documentos: Mapped[List["DocumentoKYC"]] = relationship(back_populates="loja", cascade="all, delete-orphan")
    funcionarios: Mapped[List["Funcionario"]] = relationship(back_populates="loja", cascade="all, delete-orphan")