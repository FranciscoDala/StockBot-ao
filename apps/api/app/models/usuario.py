from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Enum as SQLEnum
from app.db.base import BaseModel # <- HERDA DO BASEMODEL COM UUID
import enum

class NivelAcesso(str, enum.Enum):
    ADMIN = "admin"
    GERENTE = "gerente" 
    VENDEDOR = "vendedor"

class Usuario(BaseModel): # <- id agora é UUID, vem do BaseModel
    __tablename__ = "usuarios"
    # id, created_at, updated_at já vem do BaseModel como UUID

    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False) # <- Aumentei pra 255
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # native_enum=False = salva como VARCHAR no Postgres. Evita B.O de migration no Alembic
    nivel: Mapped[NivelAcesso] = mapped_column(
        SQLEnum(NivelAcesso, name="nivel_acesso", native_enum=False, create_type=False), # <- name trocado pra não colidir
        default=NivelAcesso.VENDEDOR, 
        nullable=False
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    vendas: Mapped[list["Venda"]] = relationship(back_populates="usuario")