from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from uuid import UUID

class ItemVendaCreate(BaseModel):
    venda_id: UUID
    produto_id: UUID
    loja_id: UUID
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal

class ItemVendaRead(BaseModel):
    id: UUID
    venda_id: UUID
    produto_id: UUID
    loja_id: UUID
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    model_config = ConfigDict(from_attributes=True)
