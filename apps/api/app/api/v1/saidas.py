from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func # <- ADICIONADO func
from datetime import datetime, date # <- ADICIONADO date
from decimal import Decimal
from uuid import UUID

from app.db.session import get_db # <- IGUAL AO LOJA.PY
from app.models.saidas import Saida
from app.models.usuario import Usuario
from app.models.caixa import Caixa, StatusCaixa # <- NOVO
from app.models.movimentacao_caixa import MovimentacaoCaixa, TipoMovimentacao # <- NOVO
from app.core.deps import get_current_user, verificar_acesso_loja
from app.websocket.manager import manager # <- ADICIONADO

router = APIRouter(prefix="/saidas", tags=["Saidas"])

# Schemas
from pydantic import BaseModel, Field
from typing import Optional

class SaidaCreateIn(BaseModel):
    loja_id: UUID
    valor: Decimal = Field(gt=0)
    descricao: Optional[str] = "Saída manual"

class SaidaOut(BaseModel):
    id: UUID
    loja_id: UUID
    valor: Decimal
    descricao: Optional[str]
    created_at: datetime # <- CORRIGIDO: era data_saida

    class Config:
        from_attributes = True

@router.post("", response_model=SaidaOut, status_code=status.HTTP_201_CREATED)
async def criar_saida(
    body: SaidaCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(body.loja_id, db, current_user)

    nova_saida = Saida(
        loja_id=body.loja_id,
        valor=body.valor,
        descricao=body.descricao
    )
    db.add(nova_saida)
    await db.commit()
    await db.refresh(nova_saida)

    # ATUALIZA ESTATISTICAS EM TEMPO REAL - NOVO
    await manager.broadcast_to_loja(
        str(body.loja_id),
        {
            "tipo": "stats.updated",
            "valor_saida": float(nova_saida.valor), # negativo pra lucro
            "acao": "add_saida"
        }
    )

    # LANÇA NO CAIXA AUTOMATICAMENTE - NOVO
    hoje = date.today()
    caixa_stmt = select(Caixa).where(
        Caixa.loja_id == body.loja_id,
        Caixa.status == StatusCaixa.ABERTO,
        func.date(Caixa.data) == hoje
    )
    caixa_res = await db.execute(caixa_stmt)
    caixa = caixa_res.scalar_one_or_none()

    if caixa:
        mov = MovimentacaoCaixa(
            caixa_id=caixa.id,
            loja_id=body.loja_id,
            usuario_id=current_user.id,
            tipo=TipoMovimentacao.SAIDA,
            valor=nova_saida.valor,
            descricao=nova_saida.descricao,
            saida_id=nova_saida.id
        )
        db.add(mov)
        await db.commit()
        await manager.broadcast_to_loja(str(body.loja_id), {"tipo": "caixa.updated"})

    return nova_saida

@router.get("", response_model=list[SaidaOut])
async def listar_saidas(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)

    stmt = select(Saida).where(Caixa.loja_id == loja_id).order_by(Saida.created_at.desc()) # <- CORRIGIDO
    result = await db.execute(stmt)
    saidas = result.scalars().all()
    return saidas
