from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # <- NOVO
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models import usuario as models
from app.schemas import usuario as schemas
from app.core.security import get_password_hash, verify_password, create_access_token # <- NOVO

router = APIRouter()

@router.post("/register", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED)
async def register_user(user_in: schemas.UsuarioCreate, db: AsyncSession = Depends(get_db)):

    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já registado")

    db_user = models.Usuario(
        nome=user_in.nome,
        email=user_in.email,
        senha_hash=get_password_hash(user_in.senha),
        nivel=user_in.nivel
    )

    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

# >>> NOVO ENDPOINT /LOGIN <<<
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Usuario).filter(models.Usuario.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.senha_hash):
        raise HTTPException(status_code=400, detail="Email ou senha incorretos")

    if not user.ativo:
        raise HTTPException(status_code=400, detail="Usuario inativo")

    access_token = create_access_token(data={"sub": str(user.id), "nivel": user.nivel.value})
    return {"access_token": access_token, "token_type": "bearer"}