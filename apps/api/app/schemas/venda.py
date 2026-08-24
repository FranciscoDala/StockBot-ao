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
    # CLIENTE
    cliente_id: UUID | None = None
    nif_cliente: Optional[str] = None # <- NOVO: se vier NIF vira FACTURA AGT
    nome_cliente: Optional[str] = None # <- NOVO: pra vendas avulsas sem cadastro

    # VALORES
    subtotal: Decimal = Decimal(0) # <- NOVO: total sem IVA
    valor_iva: Decimal = Decimal(0) # <- NOVO: IVA 14%
    total: Decimal
    total_itens: int

    # PAGAMENTO
    forma_pagamento: str
    valor_recebido: Decimal = Decimal(0)
    troco: Decimal = Decimal(0)

    # STATUS
    status: str = "emitida"
    observacao: Optional[str] = None

    # ITENS
    itens: List[ItemVendaCreate] = Field(min_length=1)

    @field_validator('valor_iva', 'total')
    @classmethod
    def calcular_valores(cls, v, info):
        # se vier só o total, calcula subtotal e iva automaticamente
        if 'subtotal' in info.data and info.data['subtotal'] > 0:
            sub = info.data['subtotal']
            iva = sub * Decimal('0.14')
            return iva if info.field_name == 'valor_iva' else sub + iva
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
    usuario_id: Optional[UUID]
    cliente_id: Optional[UUID] # <- NOVO
    nome_vendedor: str
    nome_cliente: Optional[str] = None # <- NOVO

    # VALORES AGT
    subtotal: Decimal # <- NOVO
    valor_iva: Decimal # <- NOVO
    total: Decimal
    total_itens: int

    # PAGAMENTO
    forma_pagamento: str
    valor_recebido: Decimal
    troco: Decimal

    # STATUS + AGT
    status: str
    tipo_documento: str # <- NOVO: RECIBO ou FACTURA
    serie: str # <- NOVO
    numero_fatura: Optional[str] = None # <- NOVO
    qr_code_url: Optional[str] = None # <- NOVO
    observacao: Optional[str] = None

    data_venda: datetime
    itens: List[ItemVendaRead] = []

    model_config = ConfigDict(from_attributes=True, json_encoders={Decimal: float})
