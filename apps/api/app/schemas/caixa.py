from enum import Enum
from pydantic import BaseModel
from decimal import Decimal
from uuid import UUID
from datetime import datetime

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

class CaixaResumoOut(BaseModel):
    id: UUID | None
    saldo_abertura: Decimal
    entradas_hoje: Decimal
    saidas_hoje: Decimal
    saldo_atual: Decimal
    status: StatusCaixa

class MovimentacaoOut(BaseModel):
    id: UUID
    tipo: TipoMovimentacao
    valor: Decimal
    descricao: str
    created_at: datetime
    class Config: from_attributes = True
