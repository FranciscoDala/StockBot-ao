from fastapi import FastAPI, Depends 
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, traceback, asyncio 
from typing import AsyncGenerator

from app.core.config import settings
from app.db.session import engine, Base
from app.core.deps import get_current_user
from app.core.middleware import TenantMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def import_all_models():
    """Força o import de todos os models SEMPRE. Evita circular e skip."""
    logger.info("🔄 Forçando import de todos os models...")
    from app.models.loja import Loja 
    from app.models.produto import Produto
    from app.models.venda import Venda, ItemVenda 
    from app.models.usuario import Usuario 
    logger.info(f"✅ MODELS REGISTRADOS NO METADATA: {', '.join(Base.metadata.tables.keys())}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("🚀 StockBot AO API a iniciar...")
    import_all_models()

    try:
        logger.info("⏳ Tentando criar tabelas no DB... max 7s")
        async with engine.begin() as conn:
            await asyncio.wait_for(conn.run_sync(Base.metadata.create_all), timeout=7.0) 
        logger.info("✅ Tabelas criadas/verificadas no DB.")
    except asyncio.TimeoutError:
        logger.error("❌ FALHA CRÍTICA: Postgres não respondeu em 7s. Confere serviço/senha/porta 5432.")
    except Exception as e:
        logger.error(f"❌ ERRO AO CRIAR TABELAS: {e}")
        logger.error(traceback.format_exc())
    
    yield
    logger.info("👋 StockBot AO API a desligar...")

app = FastAPI(
    title="StockBot AO API", 
    version="1.0.0", 
    lifespan=lifespan, 
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# 1. CORS SEMPRE PRIMEIRO -> Senão bloqueia o OPTIONS
app.add_middleware(
    CORSMiddleware, 
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ], # <- Hardcoded pra garantir. Pode tirar o settings depois.
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# 2. Tenant DEPOIS do CORS
app.add_middleware(TenantMiddleware)

@app.get("/health", tags=["Health"])
async def health_check(): 
    return {"status": "ok"}

@app.get("/me", tags=["Auth"])
async def read_me(current_user: "Usuario" = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "nome": current_user.nome, 
        "email": current_user.email, 
        "nivel": current_user.nivel.value
    }

# >>> REGISTRO DOS ROUTERS <<<
from app.api.v1 import auth as auth_router
from app.api.v1 import usuario as usuario_router 
from app.api.v1 import loja as loja_router
from app.api.v1.produto import router as produto_router
from app.api.v1.venda import router as venda_router
from app.api.v1.webhook import router as webhook_router

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(usuario_router.router, prefix="/api/v1", tags=["Usuarios"])
app.include_router(loja_router.router, prefix="/api/v1", tags=["Lojas"])
app.include_router(produto_router, prefix="/api/v1/loja/{slug}/produtos", tags=["Produtos"])
app.include_router(venda_router, prefix="/api/v1/loja/{slug}/vendas", tags=["Vendas"])
app.include_router(webhook_router, prefix="/api/v1/webhook", tags=["WhatsApp"])