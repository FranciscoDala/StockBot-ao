import asyncio
from sqlalchemy import text
from api.app.db.session import engine
from api.app.db.base import Base

# SÓ IMPORTA OS MODELS QUE TU TEM EM ARQUIVO
from api.app.models.usuario import Usuario
from api.app.models.loja import Loja 
from api.app.models.produto import Produto
from api.app.models.venda import Venda
from api.app.models.itens_venda import ItemVenda

async def main():
    async with engine.begin() as conn:
        print("Apagando tudo com CASCADE...")
        await conn.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
        
        print("Criando tabelas novas...")
        await conn.run_sync(Base.metadata.create_all)
        
    print("✅ Banco resetado")

asyncio.run(main())