import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from api.app.core.config import settings

async def reset():
    print(f"DB: {settings.ASYNC_DATABASE_URL[:50]}...")
    engine = create_async_engine(settings.ASYNC_DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))

    await engine.dispose()
    print("DB resetado com sucesso!")

if __name__ == "__main__":
    asyncio.run(reset())
