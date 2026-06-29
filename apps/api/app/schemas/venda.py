from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import List

class ItemVendaCreate(BaseModel):
    produto_id: int
    quantidade: int = Field(gt=0, description="Quantidade tem que ser > 0")

class VendaCreate(BaseModel):
    itens: List[ItemVendaCreate] = Field(min_length=1, description="Venda precisa ter no mínimo 1 item")

class ItemVendaRead(BaseModel):
    id: int
    produto_id: int
    nome_produto: str
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    model_config = ConfigDict(from_attributes=True)

class VendaRead(BaseModel):
    id: int
    usuario_id: int
    nome_vendedor: str
    total: Decimal
    created_at: datetime
    status: str # <- ADD STATUS
    itens: List[ItemVendaRead]
    model_config = ConfigDict(from_attributes=True)