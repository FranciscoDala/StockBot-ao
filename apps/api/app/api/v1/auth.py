from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.crud import usuario as crud_usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut
from app.schemas.token import Token # <- Precisa criar esse schema
from app.core.security import verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    db_user = await crud_usuario.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email já registado")
    return await crud_usuario.create_user(db=db, user_in=user_in)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await crud_usuario.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.senha_hash):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")
    if not user.ativo:
        raise HTTPException(status_code=400, detail="Usuario inativo")

    access_token = create_access_token(data={"sub": str(user.id), "nivel": user.nivel.value})
    return {"access_token": access_token, "token_type": "bearer"}