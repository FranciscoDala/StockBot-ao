from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.loja import Loja

async def get_loja_by_slug(db: AsyncSession, *, slug: str) -> Loja | None:
    result = await db.execute(select(Loja).where(Loja.slug == slug))
    return result.scalar_one_or_none()