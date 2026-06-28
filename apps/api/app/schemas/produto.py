from pydantic import BaseModel

class ProdutoCreate(BaseModel):
    nome: str
    preco: float
    stock: int = 0

class ProdutoOut(ProdutoCreate):
    id: int

    class Config:
        from_attributes = True # Pra converter SQLAlchemy -> Pydantic