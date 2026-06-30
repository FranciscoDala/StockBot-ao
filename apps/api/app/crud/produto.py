from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from fastapi import HTTPException

from app.models.produto import Produto
from app.core.tenant import get_current_loja_id # <- Pega o ID que o Middleware guardou
from app.schemas.produto import ProdutoCreate, ProdutoUpdate


async def create_produto(db: AsyncSession, produto_in: ProdutoCreate) -> Produto:
    loja_id = get_current_loja_id()
    if not loja_id:
        raise HTTPException(status_code=400, detail="Loja não identificada na request")
    
    db_obj = Produto(**produto_in.model_dump(), loja_id=loja_id) # <- Injeta a trava
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def get_produtos(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Produto]:
    loja_id = get_current_loja_id()
    if not loja_id:
        raise HTTPException(status_code=400, detail="Loja não identificada na request")
    
    stmt = select(Produto).where(Produto.loja_id == loja_id).offset(skip).limit(limit) # <- A TRAVA
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_produto_by_id(db: AsyncSession, produto_id: UUID) -> Produto | None:
    loja_id = get_current_loja_id()
    stmt = select(Produto).where(Produto.id == produto_id, Produto.loja_id == loja_id) # <- A TRAVA
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def update_produto(db: AsyncSession, produto_id: UUID, produto_in: ProdutoUpdate) -> Produto | None:
    db_obj = await get_produto_by_id(db, produto_id) # Já vem filtrado por loja
    if not db_obj:
        return None
    
    for field, value in produto_in.model_dump(exclude_unset=True).items():
        setattr(db_obj, field, value)
    
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def delete_produto(db: AsyncSession, produto_id: UUID) -> bool:
    db_obj = await get_produto_by_id(db, produto_id) # Já vem filtrado por loja
    if not db_obj:
        return False
    
    await db.delete(db_obj)
    await db.commit()
    return True