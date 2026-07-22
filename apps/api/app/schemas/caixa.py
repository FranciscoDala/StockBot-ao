from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import Optional, List
from app.models.caixa import StatusCaixa
from app.models.movimentacao_caixa import TipoMovimentacao

class AbrirCaixaIn(BaseModel):
    loja_id: UUID
    saldo_abertura: Decimal = Field(ge=0)
    observacao: Optional[str] = None

class SangriaCaixaIn(BaseModel):
    loja_id: UUID
    valor: Decimal = Field(gt=0)
    descricao: str

class FecharCaixaIn(BaseModel):
    loja_id: UUID
    saldo_contado: Decimal = Field(ge=0)
    observacao: Optional[str] = None

class MovimentacaoCaixaOut(BaseModel):
    id: UUID
    tipo: TipoMovimentacao
    valor: Decimal
    descricao: Optional[str]
    created_at: datetime
    class Config: from_attributes = True

class CaixaOut(BaseModel):
    id: UUID
    loja_id: UUID
    data: datetime
    status: StatusCaixa
    saldo_abertura: Decimal
    saldo_fechamento: Decimal
    saldo_contado: Decimal
    diferenca: Decimal
    movimentacoes: List[MovimentacaoCaixaOut] = []
    class Config: from_attributes = True
