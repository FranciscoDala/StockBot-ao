from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import traceback

from app.db.session import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioOut
from app.crud import usuario as crud_usuario

router = APIRouter(prefix="/usuarios", tags=["V1 - Usuarios"])

@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
async def criar_usuario(usuario_in: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    # LOG 1: O que o FastAPI recebeu e validou
    print("="*40)
    print("1. DADOS VALIDADOS PELO PYDANTIC:", usuario_in.model_dump())
    print("="*40)

    try:
        db_user = await crud_usuario.get_user_by_email(db, email=usuario_in.email)
        if db_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já cadastrado")
        
        # LOG 2: Antes de criar no DB
        print("2. VOU CRIAR O USUARIO NO DB")
        novo_user = await crud_usuario.create_user(db=db, user_in=usuario_in)
        return novo_user

    except Exception as e:
        # LOG 3: Se quebrar no CRUD/DB, mostra o erro real no terminal
        print("="*40)
        print("ERRO NO CRUD/DB:", str(e))
        traceback.print_exc()
        print("="*40)
        raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(e)}")


@router.get("/{user_id}", response_model=UsuarioOut)
async def ler_usuario(user_id: UUID, db: AsyncSession = Depends(get_db)):
    raise HTTPException(status_code=501, detail="Not Implemented")