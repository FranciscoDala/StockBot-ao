from fastapi import FastAPI, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, traceback
from typing import AsyncGenerator

from api.app.db.session import engine, Base
from api.app.core.deps import get_current_user
from api.app.core.middleware import TenantMiddleware
from api.app.models.usuario import Usuario
from api.app.schemas.usuario import UsuarioOut

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def import_all_models():
    """Força o SQLAlchemy a registrar todos os models 1x só. Evita duplicidade."""
    logger.info("🔄 Forçando import de todos os models...")

    # Ordem: Base -> Sem dependência circular -> Tabelas de associação por último
    from api.app.models.usuario import Usuario
    from api.app.models.loja import Loja
    from api.app.models.produto import Produto
    from api.app.models.venda import Venda
    from api.app.models.itens_venda import ItemVenda
    from api.app.models.documento import DocumentoKYC # <- 1. NOVO
    from api.app.models.funcionario import Funcionario # <- 2. NOVO
    from api.app.models.usuario_loja import usuario_loja # <- Tabela de associação

    tabelas = sorted(list(Base.metadata.tables.keys()))
    logger.info(f"✅ MODELS REGISTRADOS NO METADATA: {', '.join(tabelas)}")
    logger.info(f"📊 Total: {len(tabelas)} tabelas mapeadas.")

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("🚀 StockBot AO API a iniciar...")

    import_all_models()

    try:
        async with engine.begin() as conn:
            table_exists = await conn.run_sync(lambda sync_conn: sync_conn.dialect.has_table(sync_conn, "usuarios"))

            if not table_exists:
                logger.warning("⚠️ Tabelas não encontradas. Criando tudo no Postgres...")
                await conn.run_sync(Base.metadata.create_all)
                tabelas_criadas = await conn.run_sync(lambda sync_conn: sync_conn.dialect.get_table_names(sync_conn))
                logger.info(f"✅ TABELAS CRIADAS NO BANCO: {', '.join(sorted(tabelas_criadas))}")
            else:
                logger.info("✅ Tabelas já existem. Pulando criação.")
                # 3. AVISO IMPORTANTE: create_all não adiciona colunas novas
                logger.warning("⚠️ Se adicionaste colunas novas, dropa o DB ou usa Alembic.")

    except Exception as e:
        logger.error(f"❌ ERRO CRÍTICO AO VERIFICAR/CRIAR TABELAS: {e}\n{traceback.format_exc()}")
        raise e

    yield
    logger.info("👋 API a desligar...")

app = FastAPI(title="StockBot AO API", version="1.0.0", lifespan=lifespan, docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)
app.add_middleware(TenantMiddleware)

api_v1_router = APIRouter(prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}

@app.get("/me", response_model=UsuarioOut, tags=["Auth"])
async def read_me(current_user: Usuario = Depends(get_current_user)):
    return current_user

# >>> REGISTRO DOS ROUTERS <<<
from api.app.api.v1 import auth as auth_router
from api.app.api.v1 import usuario as usuario_router
from api.app.api.v1 import loja as admin_loja_router
from api.app.api.v1 import company as company_router # <- Alias pra /company
from api.app.api.v1.produto import router as produto_router
from api.app.api.v1.venda import router as venda_router
from api.app.api.v1.webhook import router as webhook_router

api_v1_router.include_router(auth_router.router, prefix="/auth", tags=["Auth"])
api_v1_router.include_router(usuario_router.router, prefix="/usuarios", tags=["Usuarios"])
api_v1_router.include_router(admin_loja_router.router, prefix="/lojas", tags=["Lojas"])
api_v1_router.include_router(company_router.router, prefix="/company", tags=["Company"]) # <- Alias
api_v1_router.include_router(produto_router, prefix="/loja/{slug}/produtos", tags=["Produtos"])
api_v1_router.include_router(venda_router, prefix="/loja/{slug}/vendas", tags=["Vendas"])
api_v1_router.include_router(webhook_router, prefix="/webhook", tags=["WhatsApp"])

app.include_router(api_v1_router)