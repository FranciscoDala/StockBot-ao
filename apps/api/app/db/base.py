from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class BaseModel(Base):
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False) # <- VOLTEI nullable=False

# FORÇA REGISTRAR TODOS MODELS NA ORDEM CERTA PRA ALEMBIC
def import_all_models():
    from app.models.loja import Loja
    from app.models.usuario import Usuario
    from app.models.usuario_loja import UsuarioLoja
    from app.models.cliente import Cliente
    from app.models.categoria import Categoria
    from app.models.fornecedor import Fornecedor
    from app.models.produto import Produto
    from app.models.venda import Venda
    from app.models.itens_venda import ItemVenda
    from app.models.documento import Documento
    from app.models.saidas import Saida
    from app.models.caixa import Caixa
    from app.models.movimentacao_caixa import MovimentacaoCaixa
    from app.models.movimentacao_venda import MovimentoVenda # <- Nome do arquivo
