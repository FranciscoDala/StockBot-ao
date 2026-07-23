from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional
import uuid

class MovimentacaoCaixaOut(BaseModel):
    id: uuid.UUID
    caixa_id: uuid.UUID
    loja_id: uuid.UUID # <- ADICIONA
    tipo: str
    valor: Decimal
    descricao: str
    referencia_id: Optional[uuid.UUID] = None
    referencia_tipo: Optional[str] = None
    usuario_id: uuid.UUID # <- ADICIONA
    created_at: datetime
    forma_pagamento: Optional[str] = None # <- ADICIONA ISSO

    class Config:
        from_attributes = True
