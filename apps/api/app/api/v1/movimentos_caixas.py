from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.models.movimentos_caixas import MovimentacaoCaixa
from app.models.caixas import Caixa
from app.models.usuario import Usuario
from app.schemas.movimentos_caixas import MovimentacaoCaixaOut
from app.core.deps import get_current_user, verificar_acesso_loja

router = APIRouter()

@router.get("/{caixa_id}", response_model=List[MovimentacaoCaixaOut])
async def listar_movimentacoes_caixa(
    caixa_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    caixa = await db.get(Caixa, caixa_id)
    if not caixa: raise HTTPException(status_code=404, detail="Caixa não encontrado")
    await verificar_acesso_loja(caixa.loja_id, db, current_user)

    stmt = select(MovimentacaoCaixa).where(MovimentacaoCaixa.caixa_id == caixa_id).order_by(MovimentacaoCaixa.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
