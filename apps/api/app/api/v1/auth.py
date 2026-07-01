from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from api.app.db.session import get_db
from api.app.schemas.token import Token
from api.app.core.security import verify_password, create_access_token, authenticate_user # <- adicionei authenticate_user
from api.app.models.usuario import Usuario, NivelUsuario # <- 1. ESSA LINHA QUE FALTAVA

router = APIRouter()

@router.post("/login") # <- Tirei o response_model=Token pra poder retornar o user
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # <- 2. Usa o authenticate_user que já tem a regra da loja inativa
    user = await authenticate_user(db, email=form_data.username, password=form_data.password)

    access_token = create_access_token(data={"sub": str(user.id), "nivel": user.nivel.value})

    loja_slug = "admin"
    if user.nivel == NivelUsuario.GERENTE:
        loja_slug = user.lojas_gerente[0].slug if user.lojas_gerente else "admin"
    elif user.nivel == NivelUsuario.VENDEDOR:
        loja_slug = user.lojas_gerente[0].slug if user.lojas_gerente else "admin"
    elif user.nivel == NivelUsuario.ADMIN:
        loja_slug = user.lojas_dono[0].slug if user.lojas_dono else "admin"

    # FIX: Retorna o objeto user completo pro front decidir pra onde ir
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "loja_slug": loja_slug,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "nome": user.nome,
            "nivel": user.nivel.value # <- "admin", "gerente", "vendedor"
        }
    }