from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload # <- NOVO
from uuid import UUID

from app.db.session import get_db
from app.crud import usuario as crud_usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut
from app.schemas.token import Token 
from app.core.security import verify_password, create_access_token
from app.models.loja import Loja 
from app.models.usuario import Usuario # <- NOVO

router = APIRouter()

@router.post("/register", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_in: UsuarioCreate, 
    loja_slug: str,
    db: AsyncSession = Depends(get_db)
):
    db_user = await crud_usuario.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email já registado")
    
    loja = await crud_loja.get_loja_by_slug(db, slug=loja_slug)
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")

    user_create_data = user_in.model_dump()
    # Aqui tu tem que criar a relação na tabela de associação, não jogar loja_id no user
    user = await crud_usuario.create_user(db=db, user_in=user_create_data)
    loja.usuarios.append(user) # <- Associa user na loja
    await db.commit()
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # FIX: Carrega as lojas junto com o user
    stmt = select(Usuario).options(selectinload(Usuario.lojas)).where(Usuario.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.senha_hash):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")
    if not user.ativo:
        raise HTTPException(status_code=400, detail="Usuario inativo")
    if not user.lojas: # <- Se o user não tiver loja
        raise HTTPException(status_code=404, detail="Usuário sem loja vinculada")

    access_token = create_access_token(data={"sub": str(user.id), "nivel": user.nivel.value})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "loja_slug": user.lojas[0].slug # <- Pega a 1ª loja pra redirecionar
    }