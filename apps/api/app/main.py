from fastapi import FastAPI, Depends 
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging, traceback

from app.core.config import settings
from app.db.session import engine, Base
from app.core.deps import get_current_user
from app.models.usuario import Usuario # <- 1x só, usado no /me e no print

# >>> ROTERS V1 <<<
from app.api.v1 import auth as auth_router
from app.api.v1 import usuario as usuario_router 
from app.api.v1.produto import router as produto_router
from app.api.v1.venda import router as venda_router
from app.api.v1.webhook import router as webhook_router

# >>> IMPORTA TODOS OS MODELS AQUI PRA REGISTRAR NO METADATA <<<
# Isso é obrigatório pro create_all funcionar. Só rodar o import já registra.
try:
    from app.models.produto import Produto
    from app.models.venda import Venda, ItemVenda
    print(f"✅ MODELS IMPORTADOS: {Usuario.__tablename__}, {Produto.__tablename__}, {Venda.__tablename__}, {ItemVenda.__tablename__}")
except Exception as e:
    print(f"❌ FALHOU AO IMPORTAR MODELS: {e}")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 StockBot AO API a iniciar...")
    logger.info(f"Tabelas no metadata: {list(Base.metadata.tables.keys())}")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all) 
        logger.info("✅ Tabelas criadas/verificadas no DB.")
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

app.add_middleware(
    CORSMiddleware, 
    allow_origins=settings.ALLOWED_ORIGINS, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.get("/health", tags=["Health"])
async def health_check(): 
    return {"status": "ok"}

@app.get("/me", tags=["Auth"])
async def read_me(current_user: Usuario = Depends(get_current_user)):
    return {
        "id": str(current_user.id), # <- Força virar str pra não dar B.O no JSON
        "nome": current_user.nome, 
        "email": current_user.email, 
        "nivel": current_user.nivel.value
    }

# >>> REGISTRO DOS ROUTERS <<<
# Padrão: v1 fica só aqui. Dentro do router fica só /usuarios, /produtos...
app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(usuario_router.router, prefix="/api/v1") 
app.include_router(produto_router, prefix="/api/v1/produtos", tags=["Produtos"])
app.include_router(venda_router, prefix="/api/v1/vendas", tags=["Vendas"])
app.include_router(webhook_router, prefix="/api/v1/webhook", tags=["WhatsApp"])