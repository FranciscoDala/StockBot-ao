import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# 1. Garante que o Python ache o /api
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# 2. Base e Config
from api.app.db.base import Base
from api.app.core.config import settings

# 3. IMPORTA TODOS OS MODELS AQUI PRA REGISTRAR NO METADATA
import api.app.models.usuario
import api.app.models.loja
import api.app.models.usuario_loja
import api.app.models.categoria
import api.app.models.fornecedor
import api.app.models.produto
import api.app.models.venda
import api.app.models.itens_venda
import api.app.models.documento
import api.app.models.saidas
import api.app.models.caixa           # <- ADICIONA
import api.app.models.movimentacao_caixa  # <- ADICIONA

# this is the Alembic Config object
config = context.config

# FORÇA O DRIVER SYNC PRO ALEMBIC
sync_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
config.set_main_option("sqlalchemy.url", sync_url)

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
