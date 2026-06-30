from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.tenant import set_current_loja_id
from app.models.loja import Loja
from app.db.session import AsyncSessionLocal

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Pega o slug da URL. Ex: /loja/ana/produtos -> slug = "ana"
        path_parts = request.url.path.split("/")
        
        if len(path_parts) > 2 and path_parts[1] == "loja":
            slug = path_parts[2]
            
            # 2. Busca no DB: Esse slug existe?
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Loja).where(Loja.slug == slug))
                loja = result.scalar_one_or_none()

                if not loja:
                    raise HTTPException(status_code=404, detail=f"Loja '{slug}' não encontrada")
                
                # 3. Guarda o UUID da loja na "caixa segura" da request
                set_current_loja_id(loja.id)
                
                # 4. Libera passar pro Router
                response = await call_next(request)
                return response
        
        # Se a rota for /docs, /login, etc... deixa passar sem filtro
        response = await call_next(request)
        return response