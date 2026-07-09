from fastapi import FastAPI, Depends, APIRouter, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging, traceback, uuid
from typing import AsyncGenerator
from pathlib import Path

from app.db.session import engine, Base
from app.core.deps import get_current_user, require_role
from app.core.config import settings
from app.models.usuario import Usuario
from app.schemas.usuario import userread, Role

# Cloudinary
import cloudinary
from cloudinary import CloudinaryImage
import cloudinary.uploader

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Configura Cloudinary
cloudinary.config(
    cloud_name = settings.CLOUDINARY_CLOUD_NAME,
    api_key = settings.CLOUDINARY_API_KEY,
    api_secret = settings.CLOUDINARY_API_SECRET
)
logger.info(f"Cloudinary Configurado: {settings.CLOUDINARY_CLOUD_NAME}")

def import_all_models():
    logger.info("forçando import de todos os models...")
    from app.models.usuario import Usuario
    from app.models.loja import Loja
    from app.models.usuario_loja import UsuarioLoja
    from app.models.produto import Produto
    from app.models.venda import Venda
    from app.models.itens_venda import ItemVenda
    from app.models.documento import DocumentoKYC
    from app.models.role import UserRole
    from app.models.categoria import Categoria
    from app.models.fornecedor import Fornecedor
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

app = FastAPI(
    title="stockbot ao api",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    root_path="/api/v1"
)

logger.info(f"CORS liberado para: {settings.ALLOWED_ORIGINS_LIST}")

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Erro 500 nao tratado na rota {request.url}: {exc}\n{traceback.format_exc()}")
    return JSONResponse(status_code=500, content={"detail": f"Erro interno: {str(exc)}"})

# VOLTOU: Pasta local pra dev
UPLOAD_DIR = Path("apps/uploads/produtos")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)
app.mount("/uploads", StaticFiles(directory="apps/uploads"), name="uploads")

api_v1_router = APIRouter()

# ROTA 1: SALVAR LOCAL - pra dev/teste
@api_v1_router.post("/upload/produto/local", tags=["upload"], dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def upload_produto_local(file: UploadFile = File(...)):
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
    MAX_FILE_SIZE = 5 * 1024 * 1024

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

    base_url = settings.BASE_URL
    url = f"{base_url}/uploads/produtos/{file_name}"
    logger.info(f"[LOCAL] Arquivo salvo: {url}")
    return {"url": url, "filename": file_name, "storage": "local"}

# ROTA 2: SALVAR CLOUDINARY - pra produção
@api_v1_router.post("/upload/produto/cloudinary", tags=["upload"], dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def upload_produto_cloudinary(file: UploadFile = File(...)):
    return await _upload_to_cloudinary(file)

# FUNCAO REUTILIZAVEL CLOUDINARY
async def _upload_to_cloudinary(file: UploadFile):
    ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
    MAX_FILE_SIZE = 5 * 1024 * 1024

    extension = file.filename.split(".")[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        return JSONResponse(status_code=400, content={"detail": "Formato invalido. Use: jpg, jpeg, png, webp"})

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        return JSONResponse(status_code=400, content={"detail": "Arquivo muito grande. Max 5MB"})

    try:
        logger.info(f"[CLOUDINARY] Enviando arquivo: {file.filename} - Tamanho: {len(contents)} bytes")

        upload_result = cloudinary.uploader.upload(
            contents,
            folder="stockbot/apps/uploads/produtos",
            resource_type="image"
        )

        logger.info(f"[CLOUDINARY] SUCESSO! URL: {upload_result['secure_url']}")

        public_id = upload_result['public_id']
        optimized_url = CloudinaryImage(public_id).build_url(
            fetch_format="auto",
            quality="auto"
        )

        return {
            "original_url": upload_result['secure_url'],
            "optimized_url": optimized_url,
            "public_id": public_id,
            "width": upload_result['width'],
            "height": upload_result['height'],
            "format": upload_result['format'],
            "size_bytes": upload_result['bytes'],
            "storage": "cloudinary"
        }
    except Exception as e:
        logger.error(f"[CLOUDINARY] ERRO: {e}\n{traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"detail": f"Erro ao enviar para Cloudinary: {str(e)}"})

@api_v1_router.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}

@app.get("/health", tags=["health"])
async def health_check_root():
    return {"status": "ok"}

@app.get("/me", response_model=userread, tags=["auth"])
async def read_me(current_user: Usuario = Depends(get_current_user)):
    return current_user

from app.api.v1 import auth as auth_router
from app.api.v1 import usuario as usuario_router
from app.api.v1 import loja as admin_loja_router
from app.api.v1 import company as company_router
from app.api.v1 import users as users_router
from app.api.v1 import produto as produto_router
from app.api.v1 import venda as venda_router
from app.api.v1 import webhook as webhook_router
from app.api.v1 import documentos as documentos_router

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
