from pydantic import BaseModel, Field
from enum import Enum
from decimal import Decimal
from uuid import UUID
from datetime import datetime, date

class StatusCaixa(str, Enum):
    ABERTO = "aberto"
    FECHADO = "fechado"

class TipoMovimentacao(str, Enum):
    ABERTURA = "abertura"
    ENTRADA = "entrada"
    SAIDA = "saida"
    SANGRIA = "sangria"
    ESTORNO = "estorno"
    SUPRIMENTO = "suprimento"

# INPUTS
class CaixaAbrirIn(BaseModel):
    loja_id: UUID
    saldo_abertura: Decimal = Field(default=Decimal(0))
    observacao: str | None = None

class CaixaFecharIn(BaseModel):
    saldo_contado: Decimal
    senha_dono: str
    observacao: str | None = None

class SangriaIn(BaseModel):
    loja_id: UUID
    valor: Decimal
    descricao: str

# OUTPUTS
class CaixaResumoOut(BaseModel):
    id: UUID | None
    saldo_abertura: Decimal
    entradas_hoje: Decimal
    saidas_hoje: Decimal
    saldo_atual: Decimal
    status: StatusCaixa

    class Config:
        from_attributes = True

class MovimentacaoOut(BaseModel):
    id: UUID
    caixa_id: UUID
    tipo: TipoMovimentacao
    valor: Decimal
    descricao: str
    referencia_id: UUID | None
    referencia_tipo: str | None
    usuario_id: UUID | None
    created_at: datetime

    class Config:
        from_attributes = True
