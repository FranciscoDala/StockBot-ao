from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime, date
from typing import Optional
import uuid

class AcaoSensivelAuth(BaseModel):
    senha_dono: str = Field(..., min_length=1)

# REQUESTS
class CaixaAbrirIn(BaseModel):
    loja_id: uuid.UUID
    saldo_abertura: Decimal = Field(default=0.00, ge=0)
    observacao: Optional[str] = None

class CaixaFecharIn(AcaoSensivelAuth):
    saldo_contado: Decimal = Field(ge=0)
    observacao: Optional[str] = None

class SangriaIn(BaseModel):
    loja_id: uuid.UUID
    valor: Decimal = Field(gt=0)
    descricao: str = Field(min_length=3, max_length=255)

# RESPONSES - Bate com o frontend CaixaResumo
class CaixaResumoOut(BaseModel):
    id: Optional[uuid.UUID] = None
    saldo_abertura: Decimal
    entradas_hoje: Decimal
    saidas_hoje: Decimal
    saldo_atual: Decimal
    status: str
