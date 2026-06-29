from pydantic import BaseModel
from uuid import UUID

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer" # <- Padrão OAuth2

class TokenData(BaseModel):
    user_id: UUID | None = None
    # nivel: str | None = None # <- Se quiseres puxar o nível do token depois, descomenta