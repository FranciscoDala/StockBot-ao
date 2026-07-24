from __future__ import annotations
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Integer, Numeric, ForeignKey, Text, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime
from  ..db.base import BaseModel
from typing import TYPE_CHECKING
from decimal import Decimal

if TYPE_CHECKING:
    from  app.models.loja import Loja
    from  app.models.itens_venda import ItemVenda
    from  app.models.categoria import Categoria
    from  app.models.fornecedor import Fornecedor

class UnidadeEnum(str, enum.Enum):
    UN = "UN"
    KG = "KG"
    CX = "CX"
    GRADE = "GRADE"
    CESTA = "CESTA"
    PCT = "PCT"
    LT = "LT"
    MT = "MT"

class Produto(BaseModel):
    __tablename__ = "produtos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loja_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False, index=True)

    # 1. BASICO
    nome: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    categoria_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True, index=True)
    marca: Mapped[str | None] = mapped_column(String(100), nullable=True)
    imagem_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # 2. CODIGOS
    sku: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    codigo_barras: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True, unique=False)
    codigo_qr: Mapped[str | None] = mapped_column(Text, nullable=True) # <-- MUDOU AQUI: Text em vez de String(255)
    ncm: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # 3. PREÇOS
    preco_compra: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    preco_venda: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    preco_promocao: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    margem_lucro: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    custo_medio: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)

    # 4. ESTOQUE
    estoque: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estoque_minimo: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    estoque_maximo: Mapped[int | None] = mapped_column(Integer, nullable=True)
    controla_estoque: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False) # <- ADICIONA ESSA LINHA
    unidade: Mapped[UnidadeEnum] = mapped_column(Enum(UnidadeEnum), default=UnidadeEnum.UN, nullable=False)
    peso_kg: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)

    # 5. FORNECEDOR
    fornecedor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("fornecedores.id", ondelete="SET NULL"), nullable=True)
    localizacao: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # 6. CONTROLE
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # RELATIONSHIPS
    loja: Mapped["Loja"] = relationship(back_populates="produtos")
    categoria: Mapped["Categoria | None"] = relationship(back_populates="produtos")
    fornecedor: Mapped["Fornecedor | None"] = relationship(back_populates="produtos")
    itens_venda: Mapped[list["ItemVenda"]] = relationship(back_populates="produto")
