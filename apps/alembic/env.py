import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# 1. ADICIONA apps/api NO PATH PRA ACHAR O app.core.config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../api')))

# 2. IMPORTA O SETTINGS QUE JÁ FUNCIONOU NO TEU TESTE
from app.core.config import settings 

# this is the Alembic Config object
config = context.config

# 3. FORÇA A URL DO ALEMBIC A SER A MESMA DO .env
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
from app.db.base import Base
target_metadata = Base.metadata

# importa todos os models aqui pra metadata ver as tabelas
from app.models.usuario import Usuario
from app.models.produto import Produto
from app.models.venda import Venda, ItemVenda

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())