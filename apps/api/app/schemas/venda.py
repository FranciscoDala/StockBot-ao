from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID

class ItemVendaCreate(BaseModel):
    produto_id: UUID
    quantidade: int = Field(gt=0)
    preco_unitario: Decimal # <- ADICIONADO
    subtotal: Decimal # <- ADICIONADO

class VendaCreate(BaseModel):
    total: Decimal
    total_itens: int
    forma_pagamento: str
    valor_recebido: Decimal = Decimal(0)
    troco: Decimal = Decimal(0)
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
    total_itens: int # <- ADICIONADO
    forma_pagamento: str # <- ADICIONADO
    valor_recebido: Decimal # <- ADICIONADO
    troco: Decimal # <- ADICIONADO
    status: str
    data_venda: datetime
    itens: List[ItemVendaRead]
    model_config = ConfigDict(from_attributes=True)
