from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

from app.db.session import get_db
from app.models.saidas import Saida
from app.models.usuario import Usuario
from app.models.caixa import Caixa, StatusCaixa
from app.models.movimentacao_caixa import MovimentacaoCaixa, TipoMovimentacao
from app.core.deps import get_current_user, verificar_acesso_loja
from app.websocket.manager import manager

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
    created_at: datetime

    class Config:
        from_attributes = True

async def get_caixa_aberto_loja(db: AsyncSession, loja_id: UUID) -> Caixa | None: # <- HELPER NOVO
    hoje = date.today()
    stmt = select(Caixa).where(
        Caixa.loja_id == loja_id,
        Caixa.status == StatusCaixa.ABERTO,
        func.date(Caixa.data_caixa) == hoje # <- era data, corrigi pra data_caixa
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

@router.post("", response_model=SaidaOut, status_code=status.HTTP_201_CREATED)
async def criar_saida(
    body: SaidaCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(body.loja_id, db, current_user)

    # BLOQUEIO: SO PODE CRIAR SAIDA COM CAIXA ABERTO
    caixa = await get_caixa_aberto_loja(db, body.loja_id)
    if not caixa:
        raise HTTPException(status_code=400, detail="Não é possível fazer saída: caixa fechado")

    try:
        nova_saida = Saida(
            loja_id=body.loja_id,
            valor=body.valor,
            descricao=body.descricao
        )
        db.add(nova_saida)
        await db.flush() # <- flush pra ter o id antes do commit

        # LANÇA NO CAIXA AUTOMATICAMENTE
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

        # Atualiza totais do caixa
        caixa.total_saidas = Decimal(str(caixa.total_saidas or 0)) + nova_saida.valor
        caixa.saldo_esperado = Decimal(str(caixa.saldo_abertura or 0)) + Decimal(str(caixa.total_entradas or 0)) - caixa.total_saidas

        await db.commit()
        await db.refresh(nova_saida)

        # ATUALIZA ESTATISTICAS EM TEMPO REAL
        await manager.broadcast_to_loja(
            str(body.loja_id),
            {
                "tipo": "stats.updated",
                "valor_saida": float(nova_saida.valor),
                "acao": "add_saida"
            }
        )
        await manager.broadcast_to_loja(str(body.loja_id), {"tipo": "caixa.updated"})

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar saída: {e}")

    return nova_saida

@router.get("", response_model=list[SaidaOut])
async def listar_saidas(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)

    stmt = select(Saida).where(Saida.loja_id == loja_id).order_by(Saida.created_at.desc()) # <- CORRIGI: era Caixa.loja_id
    result = await db.execute(stmt)
    saidas = result.scalars().all()
    return saidas
