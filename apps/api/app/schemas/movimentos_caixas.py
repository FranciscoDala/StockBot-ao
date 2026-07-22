from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional
import uuid

class MovimentacaoCaixaOut(BaseModel):
    id: uuid.UUID
    caixa_id: uuid.UUID
    tipo: str
    valor: Decimal
    descricao: str
    referencia_tipo: Optional[str] = None
    created_at: datetime
