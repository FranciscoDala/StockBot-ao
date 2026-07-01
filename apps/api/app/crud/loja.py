from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from api.app.models.loja import Loja # <- FIX AQUI

async def get_loja_by_slug(db: AsyncSession, *, slug: str) -> Loja | None:
    """Busca loja pelo slug. Usado no /register"""
    result = await db.execute(select(Loja).where(Loja.slug == slug))
    return result.scalar_one_or_none()