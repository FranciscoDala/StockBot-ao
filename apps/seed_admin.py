import asyncio
from sqlalchemy import select

# FIX 1: Força o SQLAlchemy a registar todos os models primeiro
from api.app.models.loja import Loja
from api.app.models.usuario import Usuario, NivelUsuario
from api.app.models.produto import Produto
from api.app.models.venda import Venda, ItemVenda

from api.app.db.session import AsyncSessionLocal
from api.app.core.security import get_password_hash

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Usuario).where(Usuario.email == "admin@stockbot.ao"))
        if result.scalar_one_or_none():
            print("✅ Admin já existe")
            return
        
        admin = Usuario(
            nome="StockBot Master",
            email="admin@stockbot.ao",
            senha_hash=get_password_hash("admin123"),
            nivel=NivelUsuario.ADMIN,
            ativo=True,
        )
        db.add(admin)
        await db.commit()
        print("✅ Admin criado: admin@stockbot.ao / admin123")

asyncio.run(main())