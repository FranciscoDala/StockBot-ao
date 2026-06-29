import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# 1. PEGA A PASTA RAIZ DO PROJETO: STOCKBOT-AO/
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
# 2. ADICIONA A PASTA 'apps' NO PYTHONPATH
sys.path.insert(0, os.path.join(BASE_DIR, 'apps'))

# Agora o Python vai ver: apps/api/app/...
from api.app.db.base import Base 
from api.app.models.usuario import Usuario 

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata