from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.produto import Produto
from app.schemas.produto import ProdutoCreate

async def criar_produto_service(db: AsyncSession, produto_data: ProdutoCreate) -> Produto:
    db_produto = Produto(**produto_data.model_dump())
    db.add(db_produto)
    await db.commit()
    await db.refresh(db_produto)
    return db_produto

async def listar_produtos_service(db: AsyncSession) -> list[Produto]:
    result = await db.execute(select(Produto))
    return result.scalars().all()