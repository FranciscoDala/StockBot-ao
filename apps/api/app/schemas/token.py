from pydantic import BaseModel
from uuid import UUID
from api.app.models.usuario import NivelUsuario 

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer" 
    loja_slug: str # <- NOVO: Pra fazer o redirect

class TokenData(BaseModel):
    sub: UUID | None = None       
    nivel: NivelUsuario | None = None # <- Tirei o = None pra tipar certo