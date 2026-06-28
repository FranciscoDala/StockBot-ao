from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.produto import ProdutoCreate, ProdutoOut
from app.services.produto import criar_produto_service, listar_produtos_service

router = APIRouter()

@router.post("/", response_model=ProdutoOut, status_code=201)
async def criar_produto(produto: ProdutoCreate, db: AsyncSession = Depends(get_db)):
    return await criar_produto_service(db, produto)

@router.get("/", response_model=list[ProdutoOut])
async def listar_produtos(db: AsyncSession = Depends(get_db)):
    return await listar_produtos_service(db)