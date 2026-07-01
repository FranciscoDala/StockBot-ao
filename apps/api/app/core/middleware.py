from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import select

from api.app.core.tenant import set_current_loja_id
from api.app.db.session import AsyncSessionLocal

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Pega o slug da URL. Ex: /loja/ana/produtos -> slug = "ana"
        path_parts = request.url.path.split("/")
        
        if len(path_parts) > 2 and path_parts[1] == "loja":
            slug = path_parts[2]
            
            # 2. FIX: Importa o Model aqui dentro, DEPOIS que o SQLAlchemy já carregou
            from api.app.models.loja import Loja
            
            # 3. Busca no DB: Esse slug existe?
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Loja).where(Loja.slug == slug))
                loja = result.scalar_one_or_none()

                if not loja:
                    raise HTTPException(status_code=404, detail=f"Loja '{slug}' não encontrada")
                
                # 4. Guarda o UUID da loja na "caixa segura" da request
                set_current_loja_id(loja.id)
                
                # 5. Libera passar pro Router
                response = await call_next(request)
                return response
        
        # Se a rota for /docs, /login, etc... deixa passar sem filtro
        response = await call_next(request)
        return response