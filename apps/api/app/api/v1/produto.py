from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from app.db.session import get_db
from app.schemas.produto import ProdutoCreate, ProdutoOut, ProdutoUpdate
from app.services.produto import criar_produto_service, listar_produtos_service
from app.core.deps import get_current_user, require_nivel
from app.models.usuario import NivelAcesso
from app.models.produto import Produto
from app.models.loja import Loja

router = APIRouter()

async def get_loja_or_404(db: AsyncSession, slug: str) -> Loja:
    """Helper pra buscar a loja e já barrar se não existir"""
    result = await db.execute(select(Loja).where(Loja.slug == slug))
    loja = result.scalar_one_or_none()
    if not loja:
        raise HTTPException(status_code=404, detail=f"Loja com slug '{slug}' não encontrada")
    return loja

async def get_produto_da_loja_or_404(db: AsyncSession, slug: str, produto_id: UUID) -> Produto:
    """Garante que o produto é da loja do slug. Segurança multitenant"""
    loja = await get_loja_or_404(db, slug)
    result = await db.execute(select(Produto).where(Produto.id == produto_id, Produto.loja_id == loja.id))
    produto = result.scalar_one_or_none()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado nesta loja")
    return produto


# >>> 1. CRIAR = SÓ CHEFES <<<
@router.post("/", response_model=ProdutoOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_nivel(NivelAcesso.ADMIN, NivelAcesso.GERENTE))])
async def criar_produto(slug: str, produto: ProdutoCreate, db: AsyncSession = Depends(get_db)):
    # O slug vem da URL: /loja/{slug}/produtos
    return await criar_produto_service(db, slug, produto)

# >>> 2. LISTAR = TODO MUNDO LOGADO <<<
@router.get("/", response_model=list[ProdutoOut], dependencies=[Depends(get_current_user)])
async def listar_produtos(slug: str, db: AsyncSession = Depends(get_db)):
    # Agora lista só os produtos da loja do slug
    return await listar_produtos_service(db, slug)

# >>> 3. BUSCAR POR ID = TODO MUNDO LOGADO <<<
@router.get("/{produto_id}", response_model=ProdutoOut, dependencies=[Depends(get_current_user)])
async def buscar_produto(slug: str, produto_id: UUID, db: AsyncSession = Depends(get_db)): # <- UUID
    return await get_produto_da_loja_or_404(db, slug, produto_id)

# >>> 4. EDITAR = SÓ CHEFES <<<
@router.put("/{produto_id}", response_model=ProdutoOut, dependencies=[Depends(require_nivel(NivelAcesso.ADMIN, NivelAcesso.GERENTE))])
async def atualizar_produto(slug: str, produto_id: UUID, produto_update: ProdutoUpdate, db: AsyncSession = Depends(get_db)): # <- UUID
    produto_db = await get_produto_da_loja_or_404(db, slug, produto_id)
    
    update_data = produto_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(produto_db, key, value)
        
    await db.commit()
    await db.refresh(produto_db)
    return produto_db

# >>> 5. APAGAR = SÓ CHEFES <<<
@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_nivel(NivelAcesso.ADMIN, NivelAcesso.GERENTE))])
async def apagar_produto(slug: str, produto_id: UUID, db: AsyncSession = Depends(get_db)): # <- UUID
    produto_db = await get_produto_da_loja_or_404(db, slug, produto_id)
    
    await db.delete(produto_db)
    await db.commit()
    return None