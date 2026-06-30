from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import List # <- CERTO. Não é tvoing
from uuid import UUID

class ItemVendaCreate(BaseModel):
    produto_id: UUID
    quantidade: int = Field(gt=0)

class VendaCreate(BaseModel):
    itens: List[ItemVendaCreate] = Field(min_length=1)

class ItemVendaRead(BaseModel):
    id: UUID
    produto_id: UUID
    nome_produto: str
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    model_config = ConfigDict(from_attributes=True)

class VendaRead(BaseModel):
    id: UUID
    loja_id: UUID
    usuario_id: UUID
    nome_vendedor: str
    total: Decimal
    data_venda: datetime
    status: str 
    itens: List[ItemVendaRead]
    model_config = ConfigDict(from_attributes=True)