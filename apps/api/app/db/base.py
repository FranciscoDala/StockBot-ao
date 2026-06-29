from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, declared_attr
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID # <- MUDOU
from datetime import datetime
import uuid # <- ADICIONADO

class Base(DeclarativeBase):
    """Base do SQLAlchemy 2.0"""
    pass

class BaseModel(Base):
    """
    Base abstrata para todas as tabelas.
    Já vem com id UUID, created_at e updated_at.
    """
    __abstract__ = True

    @declared_attr.directive 
    @classmethod
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s" # User -> users, Usuario -> usuarios

    # MUDOU: int -> UUID do Postgres
    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4, # <- Gera UUID no Python
        index=True
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)