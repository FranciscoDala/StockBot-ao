from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Integer, DateTime
from datetime import datetime
from..db.base import BaseModel
from typing import TYPE_CHECKING, List, Optional

if TYPE_CHECKING:
    from app.models.produto import Produto
    from app.models.venda import Venda
    from app.models.documento import DocumentoKYC
    from app.models.usuario_loja import UsuarioLoja
    from app.models.categoria import Categoria
    from app.models.fornecedor import Fornecedor
    from app.models.saidas import Saida # <- LINHA 1: ADICIONA ISSO

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
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    endereco: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    nif: Mapped[Optional[str]] = mapped_column(String(14), nullable=True)
    telefone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ano_fundacao: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # CAMPOS DE TEMA - COM DEFAULT PRA CRIAR JUNTO
    theme: Mapped[str] = mapped_column(String(20), nullable=False, default="dark", server_default="dark")
    card_style: Mapped[str] = mapped_column(String(20), nullable=False, default="padrao", server_default="padrao")
    card_size: Mapped[str] = mapped_column(String(20), nullable=False, default="medio", server_default="medio")
    font_size: Mapped[str] = mapped_column(String(20), nullable=False, default="medio", server_default="medio")

    # CORES CUSTOM - ADICIONADO
    cor_primaria: Mapped[str] = mapped_column(String(7), nullable=False, default="#10b981", server_default="#10b981")
    cor_fundo: Mapped[str] = mapped_column(String(7), nullable=False, default="#000", server_default="#000")

    # Relationships
    membros: Mapped[List["UsuarioLoja"]] = relationship(back_populates="loja", cascade="all, delete-orphan", lazy="selectin")
    produtos: Mapped[List["Produto"]] = relationship(back_populates="loja", cascade="all, delete-orphan", lazy="selectin")
    vendas: Mapped[List["Venda"]] = relationship(back_populates="loja", cascade="all, delete-orphan", lazy="selectin")
    saidas: Mapped[List["Saida"]] = relationship(back_populates="loja", cascade="all, delete-orphan", lazy="selectin") # <- LINHA 2: ADICIONA ISSO
    documentos: Mapped[List["DocumentoKYC"]] = relationship(back_populates="loja", cascade="all, delete-orphan", lazy="selectin")
    categorias: Mapped[List["Categoria"]] = relationship(back_populates="loja", cascade="all, delete-orphan", lazy="selectin")
    fornecedores: Mapped[List["Fornecedor"]] = relationship(back_populates="loja", cascade="all, delete-orphan", lazy="selectin")
