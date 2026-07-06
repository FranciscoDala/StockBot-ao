from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Integer
from api.app.db.base import BaseModel
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from api.app.models.produto import Produto
    from api.app.models.venda import Venda
    from api.app.models.documento import DocumentoKYC
    from api.app.models.usuario_loja import UsuarioLoja
    from api.app.models.categoria import Categoria # NOVO
    from api.app.models.fornecedor import Fornecedor # NOVO

class Loja(BaseModel):
    """
    Loja/Empresa do sistema.
    Uma loja tem vários membros através de UsuarioLoja
    """
    __allow_unmapped__ = True
    __tablename__ = "lojas"

    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    endereco: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ano_fundacao: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    membros: Mapped[List["UsuarioLoja"]] = relationship(
        back_populates="loja",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    produtos: Mapped[List["Produto"]] = relationship(
        back_populates="loja",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    vendas: Mapped[List["Venda"]] = relationship(
        back_populates="loja",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    documentos: Mapped[List["DocumentoKYC"]] = relationship(
        back_populates="loja",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    # NOVOS RELACIONAMENTOS
    categorias: Mapped[List["Categoria"]] = relationship(
        back_populates="loja",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    fornecedores: Mapped[List["Fornecedor"]] = relationship(
        back_populates="loja",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
