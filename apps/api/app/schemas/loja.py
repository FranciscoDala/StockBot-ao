from pydantic import BaseModel, Field
from uuid import UUID

class LojaBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    slug: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-z0-9-]+$")

class LojaCreate(LojaBase):
    pass

class LojaRead(LojaBase):
    id: UUID
    usuario_id_dono: UUID # <- Era `usuario_id`. Trocado pra bater com o Model

    class Config:
        from_attributes = True # <- Essencial pra FastAPI ler do SQLAlchemy Model