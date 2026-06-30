from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from typing import Optional
from uuid import UUID

class ProdutoBase(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    preco: Decimal = Field(gt=0) # <- Era float. Agora Decimal
    estoque: int = Field(default=0, ge=0) # <- Era `stock`. Agora `estoque`

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = Field(default=None, min_length=2, max_length=100)
    preco: Optional[Decimal] = Field(default=None, gt=0) # <- Decimal
    estoque: Optional[int] = Field(default=None, ge=0) # <- `estoque`

class ProdutoOut(ProdutoBase):
    id: UUID
    loja_id: UUID

    model_config = ConfigDict(from_attributes=True) # <- Pydantic v2