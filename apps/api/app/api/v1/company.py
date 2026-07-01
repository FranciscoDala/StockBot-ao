from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

from api.app.db.session import get_db 
from api.app.core.deps import get_current_user
from api.app.models.loja import Loja # <- 1. Usa o model Loja, não Company
from api.app.schemas.loja import LojaDetailRead # <- 2. Usa o mesmo schema

router = APIRouter() # prefix vai no main: /api/v1/company

@router.get("/{slug}", response_model=LojaDetailRead)
async def get_company_by_slug( # <- Nome antigo pra não quebrar front
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 3. MESMA QUERY DO /lojas/{slug}
    stmt = select(Loja).options(
        joinedload(Loja.gerente),
        joinedload(Loja.dono),
        selectinload(Loja.documentos),
        selectinload(Loja.funcionarios),
        selectinload(Loja.vendas)
    ).where(Loja.slug == slug)
    
    result = await db.execute(stmt)
    loja = result.scalar_one_or_none()
    
    if not loja:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return loja