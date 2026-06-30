from pydantic import BaseModel
from uuid import UUID
from app.models.usuario import NivelAcesso 

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer" 
    loja_slug: str # <- NOVO: Pra fazer o redirect

class TokenData(BaseModel):
    sub: UUID | None = None       
    nivel: NivelAcesso | None = None # <- Tirei o = None pra tipar certo