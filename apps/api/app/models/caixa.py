from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey, Date, Text, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..db.base import Base
import uuid
from datetime import date
import enum

class StatusCaixa(str, enum.Enum):
    ABERTO = 'aberto'
    FECHADO = 'fechado'

class Caixa(Base):
    __tablename__ = "caixa"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    loja_id = Column(UUID(as_uuid=True), ForeignKey("lojas.id", ondelete="CASCADE"), nullable=False, index=True)
    data_caixa = Column(Date, nullable=False, default=date.today, index=True)
    data_abertura = Column(TIMESTAMP(timezone=True), nullable=False)
    data_fechamento = Column(TIMESTAMP(timezone=True), nullable=True)
    usuario_abertura_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False, index=True)
    usuario_fechamento_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.id"))

    saldo_abertura = Column(Numeric(14, 2), default=0.00, nullable=False)
    total_entradas = Column(Numeric(14, 2), default=0.00, nullable=False)
    total_saidas = Column(Numeric(14, 2), default=0.00, nullable=False)
    saldo_esperado = Column(Numeric(14, 2), default=0.00, nullable=False)
    saldo_contado = Column(Numeric(14, 2), nullable=True)
    diferenca = Column(Numeric(14, 2), nullable=True)

    status = Column(
        Enum(
            StatusCaixa,
            name="statuscaixa",
            native_enum=False,
            values_callable=lambda x: [e.value for e in x]
        ),
        default=StatusCaixa.ABERTO,
        nullable=False,
        index=True
    )
    observacao = Column(Text)

    # Relationships
    loja = relationship("Loja")
    usuario_abertura = relationship("Usuario", foreign_keys=[usuario_abertura_id])
    usuario_fechamento = relationship("Usuario", foreign_keys=[usuario_fechamento_id])

    # REGRA NOVA: So pode ter 1 caixa ABERTO por usuario por dia
    # Isso evita que o mesmo user abra 2 caixas ao mesmo tempo
    __table_args__ = (
        Index('ix_caixa_usuario_dia_aberto', 'loja_id', 'usuario_abertura_id', 'data_caixa', unique=True,
              postgresql_where=(status == StatusCaixa.ABERTO)),
    )
