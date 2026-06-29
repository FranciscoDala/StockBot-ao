from fastapi import FastAPI, Request, status, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.security import OAuth2PasswordBearer # <- NOVO CADEADO
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import ALGORITHM # <- pra não repetir
from app.api.v1.produto import router as produto_router
from app.api.v1.venda import router as venda_router
from app.api.v1.webhook import router as webhook_router
from app.api.v1 import auth as auth_router

from app.db.session import engine, Base, get_db
from app.models.usuario import Usuario # <- Model pra proteger rota

# >>> FORÇA O IMPORT E TESTA <<<
try:
    from app.models.usuario import Usuario 
    print(f"✅ MODEL USUARIO IMPORTADO: {Usuario.__tablename__}")
except Exception as e:
    print(f"❌ FALHOU AO IMPORTAR USUARIO: {e}")

import logging
import traceback

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# >>> ISSO AQUI DESENHA O CADEADO NO /docs <<<
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nao foi possivel validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    result = await db.execute(select(Usuario).filter(Usuario.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user

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
    docs_url="/docs"
)
app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health", tags=["Health"])
async def health_check(): return {"status": "ok"}

# >>> ROTA TESTE PROTEGIDA PRA VER O CADEADO FUNCIONANDO <<<
@app.get("/me", tags=["Auth"])
async def read_me(current_user: Usuario = Depends(get_current_user)):
    return {"id": current_user.id, "nome": current_user.nome, "email": current_user.email, "nivel": current_user.nivel.value}

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(produto_router, prefix="/api/v1/produtos", tags=["Produtos"])
app.include_router(venda_router, prefix="/api/v1/vendas", tags=["Vendas"])
app.include_router(webhook_router, prefix="/api/v1/webhook", tags=["WhatsApp"])