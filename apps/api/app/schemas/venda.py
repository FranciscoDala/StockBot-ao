from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

class ItemVendaCreate(BaseModel):
    produto_id: UUID
    quantidade: int = Field(gt=0)
    preco_unitario: Decimal
    subtotal: Decimal
    model_config = ConfigDict(json_encoders={Decimal: float})

class VendaCreate(BaseModel):
    total: Decimal
    total_itens: int
    forma_pagamento: str
    valor_recebido: Decimal = Decimal(0)
    troco: Decimal = Decimal(0)
    itens: List[ItemVendaCreate] = Field(min_length=1)
    model_config = ConfigDict(json_encoders={Decimal: float})

class ItemVendaRead(BaseModel):
    id: UUID
    venda_id: UUID
    produto_id: UUID
    loja_id: UUID
    nome_produto: str # <- VAI VIR DO joinedload
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    model_config = ConfigDict(from_attributes=True, json_encoders={Decimal: float})

class VendaRead(BaseModel):
    id: UUID
    loja_id: UUID
    usuario_id: UUID
    nome_vendedor: str
    total: Decimal
    total_itens: int
    forma_pagamento: str
    valor_recebido: Decimal
    troco: Decimal
    status: str
    data_venda: datetime
    itens: List[ItemVendaRead] = [] # <- DEFAULT VAZIO PRA NAO QUEBRAR
    model_config = ConfigDict(from_attributes=True, json_encoders={Decimal: float})
