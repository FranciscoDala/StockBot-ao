from fastapi import APIRouter
from api.app.api.v1 import auth, company, documentos, funcionario, produto, usuario, users, venda, webhook
from api.app.api.v1.endpoints import loja, admin_lojas

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(loja.router, prefix="/lojas", tags=["lojas"])
api_router.include_router(admin_lojas.router, prefix="/admin/lojas", tags=["admin-lojas"])
api_router.include_router(company.router, prefix="/company", tags=["company"])
api_router.include_router(documentos.router, prefix="/documentos", tags=["documentos"])
api_router.include_router(funcionario.router, prefix="/funcionarios", tags=["funcionarios"])
api_router.include_router(produto.router, prefix="/produtos", tags=["produtos"])
api_router.include_router(usuario.router, prefix="/usuarios", tags=["usuarios"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(venda.router, prefix="/vendas", tags=["vendas"])
api_router.include_router(webhook.router, prefix="/webhook", tags=["webhook"])
