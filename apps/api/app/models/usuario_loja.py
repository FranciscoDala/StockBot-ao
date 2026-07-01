from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from api.app.db.base import Base

usuario_loja = Table(
    "usuario_loja",
    Base.metadata,
    Column("usuario_id", UUID(as_uuid=True), ForeignKey("usuarios.id"), primary_key=True),
    Column("loja_id", UUID(as_uuid=True), ForeignKey("lojas.id"), primary_key=True),
)