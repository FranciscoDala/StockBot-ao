from pydantic import BaseModel, Field, ConfigDict, field_validator
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
    cliente_id: UUID | None = None
    nif_cliente: Optional[str] = None
    nome_cliente: Optional[str] = None

    subtotal: Decimal = Decimal(0)
    valor_iva: Decimal = Decimal(0)
    total: Decimal
    total_itens: int

    forma_pagamento: str
    valor_recebido: Decimal = Decimal(0)
    troco: Decimal = Decimal(0)

    status: str = "emitida"
    observacao: Optional[str] = None
    itens: List[ItemVendaCreate] = Field(min_length=1)

    @field_validator('valor_iva', 'total', mode='before')
    @classmethod
    def calcular_valores(cls, v, info):
        data = info.data
        if 'subtotal' in data and data['subtotal'] > 0:
            sub = data['subtotal']
            iva = sub * Decimal('0.14')
            if info.field_name == 'valor_iva': return iva
            if info.field_name == 'total': return sub + iva
        return v

    model_config = ConfigDict(json_encoders={Decimal: float})

class ItemVendaRead(BaseModel):
    id: UUID
    venda_id: UUID
    produto_id: UUID
    loja_id: UUID
    nome_produto: str
    quantidade: int
    preco_unitario: Decimal
    subtotal: Decimal
    model_config = ConfigDict(from_attributes=True, json_encoders={Decimal: float})

class VendaRead(BaseModel):
    id: UUID
    loja_id: UUID
    usuario_id: Optional[UUID] = None
    cliente_id: Optional[UUID] = None
    created_at: datetime # <- volta a ser obrigatório

    data_venda: datetime # <- SEM ALIAS

    nome_vendedor: Optional[str] = None
    nome_cliente: Optional[str] = None
    cliente_nif: Optional[str] = None

    subtotal: Decimal
    valor_iva: Decimal
    total: Decimal
    total_itens: int

    forma_pagamento: str
    valor_recebido: Decimal
    troco: Decimal

    status: str
    tipo_documento: str
    serie: str
    numero_fatura: Optional[str] = None
    qr_code_url: Optional[str] = None
    observacao: Optional[str] = None

    itens: List[ItemVendaRead] = []

    @field_validator('data_venda', mode='before')
    @classmethod
    def set_data_venda(cls, v, info):
        # Pega do created_at se data_venda vier None
        return info.data.get('created_at', v)

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: float}
    )
