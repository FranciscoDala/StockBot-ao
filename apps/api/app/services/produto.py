from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from  app.models.produto import Produto
from  app.models.loja import Loja # <- Import que faltava
from  app.schemas.produto import ProdutoCreate

async def criar_produto_service(db: AsyncSession, slug: str, produto_in: ProdutoCreate) -> Produto:
    # 1. Busca a Loja pelo slug que veio da URL
    result = await db.execute(select(Loja).where(Loja.slug == slug))
    loja = result.scalar_one_or_none()

    # 2. Se não achar a loja, barra aqui antes de criar produto null
    if not loja:
        raise HTTPException(status_code=404, detail=f"Loja com slug '{slug}' não encontrada")

    # 3. Cria o produto já com o loja_id correto
    produto_data = produto_in.model_dump()
    db_produto = Produto(**produto_data, loja_id=loja.id)

    db.add(db_produto)
    await db.commit()
    await db.refresh(db_produto)
    return db_produto

async def listar_produtos_service(db: AsyncSession, slug: str) -> list[Produto]:
    # 1. Busca a Loja primeiro
    result = await db.execute(select(Loja).where(Loja.slug == slug))
    loja = result.scalar_one_or_none()

    if not loja:
        raise HTTPException(status_code=404, detail=f"Loja com slug '{slug}' não encontrada")

    # 2. Lista só os produtos dessa loja
    result = await db.execute(select(Produto).where(Produto.loja_id == loja.id))
    return result.scalars().all()

async def listar_produtos_estoque_baixo_service(db: AsyncSession, slug: str) -> list[Produto]:
    result = await db.execute(select(Loja).where(Loja.slug == slug))
    loja = result.scalar_one_or_none()
    if not loja:
        raise HTTPException(status_code=404, detail=f"Loja com slug '{slug}' não encontrada")

    stmt = select(Produto).where(
        Produto.loja_id == loja.id,
        Produto.controla_estoque == True, # só quem controla
        Produto.estoque <= Produto.estoque_minimo # <- AQUI: <= mínimo
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def listar_produtos_sem_estoque_service(db: AsyncSession, slug: str) -> list[Produto]:
    result = await db.execute(select(Loja).where(Loja.slug == slug))
    loja = result.scalar_one_or_none()
    if not loja:
        raise HTTPException(status_code=404, detail=f"Loja com slug '{slug}' não encontrada")

    stmt = select(Produto).where(
        Produto.loja_id == loja.id,
        Produto.controla_estoque == True,
        Produto.estoque == 0 # <- AQUI: == 0
    )
    result = await db.execute(stmt)
    return result.scalars().all()
