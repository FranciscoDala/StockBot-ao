from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.produto import router as produto_router # <-- /v1/
from app.api.v1.venda import router as venda_router # <-- /v1/
from app.api.v1.webhook import router as webhook_router # <-- /v1/
from app.db.session import engine, Base
import logging
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 StockBot AO API a iniciar...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all) # Cria tabelas
    yield
    logger.info("👋 StockBot AO API a desligar...")

app = FastAPI(title="StockBot AO API", version="1.0.0", lifespan=lifespan, docs_url="/docs")

app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health", tags=["Health"])
async def health_check(): return {"status": "ok"}

app.include_router(produto_router, prefix="/api/v1/produtos", tags=["Produtos"])
app.include_router(venda_router, prefix="/api/v1/vendas", tags=["Vendas"])
app.include_router(webhook_router, prefix="/api/v1/webhook", tags=["WhatsApp"])