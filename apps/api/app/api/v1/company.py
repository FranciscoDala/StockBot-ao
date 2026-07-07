from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

from  app.db.session import get_db
from  app.core.deps import get_current_user, verificar_acesso_loja # <- IMPORTA
from  app.models.loja import Loja
from  app.schemas.loja import LojaDetailFull

router = APIRouter()

# ROTA: GET /company/{slug}
# VER DADOS COMPLETOS DA EMPRESA: Admin vê qualquer. Dono só vê a dele
@router.get("/{slug}", response_model=LojaDetailFull)
async def get_company_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # 1. Busca a loja
    stmt = select(Loja).options(
        joinedload(Loja.gerente),
        selectinload(Loja.documentos),
        selectinload(Loja.funcionarios),
        selectinload(Loja.vendas)
    ).where(Loja.slug == slug)
    result = await db.execute(stmt)
    loja = result.scalar_one_or_none()

    if not loja:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    # 2. TRAVA: Verifica se admin ou dono dessa loja
    await verificar_acesso_loja(loja.id, db, current_user)

    return loja
