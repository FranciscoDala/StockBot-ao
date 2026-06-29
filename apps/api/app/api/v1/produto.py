from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.schemas.produto import ProdutoCreate, ProdutoOut, ProdutoUpdate
from app.services.produto import criar_produto_service, listar_produtos_service
from app.core.deps import get_current_user, require_nivel
from app.models.usuario import NivelAcesso
from app.models.produto import Produto

router = APIRouter()

# >>> 1. CRIAR = SÓ CHEFES <<<
@router.post("/", response_model=ProdutoOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_nivel(NivelAcesso.ADMIN, NivelAcesso.GERENTE))])
async def criar_produto(produto: ProdutoCreate, db: AsyncSession = Depends(get_db)):
    return await criar_produto_service(db, produto)

# >>> 2. LISTAR = TODO MUNDO LOGADO <<<
@router.get("/", response_model=list[ProdutoOut], dependencies=[Depends(get_current_user)])
async def listar_produtos(db: AsyncSession = Depends(get_db)):
    return await listar_produtos_service(db)

# >>> 3. BUSCAR POR ID = TODO MUNDO LOGADO <<<
@router.get("/{id}", response_model=ProdutoOut, dependencies=[Depends(get_current_user)])
async def buscar_produto(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Produto).filter(Produto.id == id))
    produto = result.scalar_one_or_none()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    return produto

# >>> 4. EDITAR = SÓ CHEFES <<<
@router.put("/{id}", response_model=ProdutoOut, dependencies=[Depends(require_nivel(NivelAcesso.ADMIN, NivelAcesso.GERENTE))])
async def atualizar_produto(id: int, produto_update: ProdutoUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Produto).filter(Produto.id == id))
    produto_db = result.scalar_one_or_none()
    if not produto_db:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    
    update_data = produto_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(produto_db, key, value)
        
    await db.commit()
    await db.refresh(produto_db)
    return produto_db

# >>> 5. APAGAR = SÓ CHEFES <<<
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_nivel(NivelAcesso.ADMIN, NivelAcesso.GERENTE))])
async def apagar_produto(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Produto).filter(Produto.id == id))
    produto_db = result.scalar_one_or_none()
    if not produto_db:
        raise HTTPException(status_code=404, detail="Produto nao encontrado")
    
    await db.delete(produto_db)
    await db.commit()
    return None