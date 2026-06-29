from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, Enum as SQLEnum
from app.db.base import BaseModel
import enum

class NivelAcesso(str, enum.Enum):
    ADMIN = "admin"
    GERENTE = "gerente" 
    VENDEDOR = "vendedor"

class Usuario(BaseModel):
    __tablename__ = "usuarios"

    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nivel: Mapped[NivelAcesso] = mapped_column(
        SQLEnum(NivelAcesso, name="nivel", native_enum=False, create_type=False),
        default=NivelAcesso.VENDEDOR, 
        nullable=False
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)