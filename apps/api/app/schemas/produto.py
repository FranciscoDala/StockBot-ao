from pydantic import BaseModel, Field, ConfigDict, computed_field
from typing import Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID
from enum import Enum

from.categoria import CategoriaOut
from.fornecedor import FornecedorOut

class UnidadeEnum(str, Enum):
    UN = "UN"
    KG = "KG"
    CX = "CX"
    GRADE = "GRADE"
    CESTA = "CESTA"
    PCT = "PCT"
    LT = "LT"
    MT = "MT"

class ProdutoBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=150)
    descricao: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=50)
    codigo_barras: Optional[str] = Field(None, max_length=50)
    codigo_qr: Optional[str] = Field(None)
    marca: Optional[str] = Field(None, max_length=100)
    imagem_url: Optional[str] = Field(None, max_length=255)
    ncm: Optional[str] = Field(None, max_length=10)

    # ENTRADA: continua Decimal pra aceitar do banco
    preco: Decimal = Field(..., gt=0, description="Preco de venda")
    preco_custo: Decimal = Field(0, ge=0, description="Preco de compra")
    preco_promocao: Optional[Decimal] = Field(None, ge=0)

    custo_medio: Decimal = Field(0, ge=0)
    estoque: int = Field(0, ge=0, description="Estoque atual")
    estoque_minimo: int = Field(5, ge=0)
    estoque_maximo: Optional[int] = Field(None, ge=0)
    unidade: UnidadeEnum = Field(UnidadeEnum.UN)
    peso_kg: Optional[Decimal] = Field(None, ge=0)
    localizacao: Optional[str] = Field(None, max_length=100)

    categoria_id: Optional[UUID] = None
    fornecedor_id: Optional[UUID] = None
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class ProdutoCreate(ProdutoBase):
    loja_id: UUID

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=150)
    descricao: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=50)
    codigo_barras: Optional[str] = Field(None, max_length=50)
    codigo_qr: Optional[str] = Field(None)
    marca: Optional[str] = Field(None, max_length=100)
    imagem_url: Optional[str] = Field(None, max_length=255)
    ncm: Optional[str] = Field(None, max_length=10)

    preco: Optional[Decimal] = Field(None, gt=0)
    preco_custo: Optional[Decimal] = Field(None, ge=0)
    preco_promocao: Optional[Decimal] = Field(None, ge=0)
    custo_medio: Optional[Decimal] = Field(None, ge=0)
    estoque: Optional[int] = Field(None, ge=0)
    estoque_minimo: Optional[int] = Field(None, ge=0)
    estoque_maximo: Optional[int] = Field(None, ge=0)
    unidade: Optional[UnidadeEnum] = None
    peso_kg: Optional[Decimal] = Field(None, ge=0)
    localizacao: Optional[str] = Field(None, max_length=100)
    categoria_id: Optional[UUID] = None
    fornecedor_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class ProdutoUpdateWithAuth(ProdutoUpdate):
    senha_dono: str
    loja_id: UUID

class ProdutoOut(BaseModel):
    id: UUID
    loja_id: UUID
    nome: str
    descricao: Optional[str] = None
    sku: Optional[str] = None
    codigo_barras: Optional[str] = None
    codigo_qr: Optional[str] = None
    marca: Optional[str] = None
    imagem_url: Optional[str] = None
    ncm: Optional[str] = None

    preco: float
    preco_custo: float
    preco_promocao: Optional[float] = None
    custo_medio: float
    estoque: float
    estoque_minimo: float
    estoque_maximo: Optional[float] = None
    unidade: UnidadeEnum
    peso_kg: Optional[float] = None
    localizacao: Optional[str] = None

    categoria_id: Optional[UUID] = None # <- só o id
    fornecedor_id: Optional[UUID] = None # <- só o id
    is_active: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    margem_lucro: float

    model_config = ConfigDict(from_attributes=True, json_encoders={Decimal: float})
