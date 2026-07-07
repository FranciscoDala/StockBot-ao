from fastapi import FastAPI, Depends, APIRouter, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging, traceback, shutil, uuid, os  # ADICIONEI os
from typing import AsyncGenerator
from pathlib import Path

from api.app.db.session import engine, Base
from api.app.core.deps import get_current_user
from api.app.models.usuario import Usuario
from api.app.schemas.usuario import userread

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def import_all_models():
    logger.info("forçando import de todos os models...")
    from api.app.models.usuario import Usuario
    from api.app.models.loja import Loja
    from api.app.models.usuario_loja import UsuarioLoja
    from api.app.models.produto import Produto
    from api.app.models.venda import Venda
    from api.app.models.itens_venda import ItemVenda
    from api.app.models.documento import DocumentoKYC
    from api.app.models.role import UserRole
    from api.app.models.categoria import Categoria
    from api.app.models.fornecedor import Fornecedor
    tabelas = sorted(list(Base.metadata.tables.keys()))
    logger.info(f"models registrados no metadata: {', '.join(tabelas)}")
    logger.info(f"total: {len(tabelas)} tabelas mapeadas.")

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("stockbot ao api a iniciar...")
    import_all_models()
    try:
        async with engine.begin() as conn:
            table_exists = await conn.run_sync(lambda sync_conn: sync_conn.dialect.has_table(sync_conn, "usuarios"))
            if not table_exists:
                logger.warning("tabelas não encontradas. criando tudo no postgres...")
                await conn.run_sync(Base.metadata.create_all)
            else:
                logger.info("tabelas já existem. pulando criação.")
    except Exception as e:
        logger.error(f"erro critico: {e}\n{traceback.format_exc()}")
        raise e
    yield
    logger.info("api a desligar...")

app = FastAPI(title="stockbot ao api", version="1.0.0", lifespan=lifespan, docs_url="/docs")

# PEGAR ORIGINS DA VARIAVEL DE AMBIENTE + LOCAL
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
allowed_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_env:
    origins.extend([o.strip() for o in allowed_env.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro 500 nao tratado na rota {request.url}: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Erro interno: {str(exc)}"},
    )

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

api_v1_router = APIRouter(prefix="/api/v1")

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}

# AJUSTE 1: Troquei a rota pra /upload/produto pra bater com o front
# AJUSTE 2: Adicionei require_role pra só dono/gerente subir imagem
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5MB

from api.app.core.deps import require_role
from api.app.schemas.usuario import Role

@api_v1_router.post("/upload/produto", tags=["upload"], dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def upload_produto_imagem(file: UploadFile = File(...)):
    extension = file.filename.split(".")[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        return JSONResponse(status_code=400, content={"detail": "Formato invalido. Use: jpg, jpeg, png, webp"})

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        return JSONResponse(status_code=400, content={"detail": "Arquivo muito grande. Max 5MB"})

    file_name = f"{uuid.uuid4()}.{extension}"
    file_path = UPLOAD_DIR / file_name
    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    url = f"/uploads/{file_name}"
    return {"url": url, "filename": file_name}

@app.get("/me", response_model=userread, tags=["auth"])
async def read_me(current_user: Usuario = Depends(get_current_user)):
    return current_user

# >>> REGISTRO DOS ROUTERS <<<
from api.app.api.v1 import auth as auth_router
from api.app.api.v1 import usuario as usuario_router
from api.app.api.v1 import loja as admin_loja_router
from api.app.api.v1 import company as company_router
from api.app.api.v1 import users as users_router
from api.app.api.v1 import produto as produto_router
from api.app.api.v1 import venda as venda_router
from api.app.api.v1 import webhook as webhook_router
from api.app.api.v1 import documentos as documentos_router

api_v1_router.include_router(auth_router.router, prefix="/auth", tags=["auth"])
api_v1_router.include_router(usuario_router.router, prefix="/usuarios", tags=["usuarios"])
api_v1_router.include_router(admin_loja_router.router, prefix="/lojas", tags=["lojas"])
api_v1_router.include_router(company_router.router, prefix="/company", tags=["company"])
api_v1_router.include_router(users_router.router, prefix="/users", tags=["users"])
api_v1_router.include_router(produto_router.router, prefix="/produtos", tags=["produtos"])
api_v1_router.include_router(venda_router.router, prefix="/vendas", tags=["vendas"])
api_v1_router.include_router(webhook_router.router, prefix="/webhook", tags=["whatsapp"])
api_v1_router.include_router(documentos_router.router, prefix="/kyc", tags=["kyc"])

app.include_router(api_v1_router)
