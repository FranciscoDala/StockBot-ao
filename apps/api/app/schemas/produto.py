from pydantic import BaseModel
from typing import Optional

class ProdutoBase(BaseModel):
    nome: str
    preco: float
    stock: int = 0 # <- Mantive stock igual ao teu

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    preco: Optional[float] = None
    stock: Optional[int] = None # <- Mantive stock

class ProdutoOut(ProdutoBase):
    id: int

    class Config:
        from_attributes = True # Pra converter SQLAlchemy -> Pydantic