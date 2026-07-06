from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import select

from api.app.core.tenant import set_current_loja_id
from api.app.db.session import AsyncSessionLocal

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # FIX 1: Se for API, Docs, Login, Auth... PASSA DIRETO SEMPRE
        if path.startswith("/api") or path.startswith("/docs") or path.startswith("/openapi") or path == "/":
            response = await call_next(request)
            return response

        # FIX 2: Só roda tenant se for rota do frontend: /loja/{slug}/...
        path_parts = path.split("/")
        if len(path_parts) > 2 and path_parts[1] == "loja":
            slug = path_parts[2]

            from api.app.models.loja import Loja

            async with AsyncSessionLocal() as db:
                result = await db.execute(select(Loja).where(Loja.slug == slug))
                loja = result.scalar_one_or_none()

                if not loja:
                    raise HTTPException(status_code=404, detail=f"Loja '{slug}' não encontrada")

                set_current_loja_id(loja.id)

                response = await call_next(request)
                return response

        # Qualquer outra rota do backend: deixa passar
        response = await call_next(request)
        return response
