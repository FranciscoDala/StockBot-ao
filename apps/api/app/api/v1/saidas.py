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
from app.models.movimentacao_caixa import TipoMovimentacao
from app.core.deps import get_current_user, verificar_acesso_loja
from app.websocket.manager import manager
from app.api.v1.caixas import registrar_movimento_caixa

def to_decimal(value) -> Decimal: # <- ADICIONADO LOCAL
    if value is None:
        return Decimal('0')
    return Decimal(str(value))


router = APIRouter(prefix="/saidas", tags=["Saidas"])

# Schemas
from pydantic import BaseModel, Field
from typing import Optional

class SaidaCreateIn(BaseModel):
    loja_id: UUID
    valor: Decimal = Field(gt=0)
    descricao: Optional[str] = "Saída manual"
    forma_pagamento: Optional[str] = "dinheiro"

class SaidaOut(BaseModel):
    id: UUID
    loja_id: UUID
    valor: Decimal
    descricao: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

async def get_caixa_aberto_loja(db: AsyncSession, loja_id: UUID) -> Caixa | None:
    hoje = date.today()
    stmt = select(Caixa).where(
        Caixa.loja_id == loja_id,
        Caixa.status == StatusCaixa.ABERTO,
        func.date(Caixa.data_caixa) == hoje
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
        await db.flush() # <- flush pra ter o id

        # CAST PRA PARAR O PYLANCE DE RECLAMAR
        valor_saida = to_decimal(nova_saida.valor) # type: ignore
        saida_id = UUID(str(nova_saida.id)) # type: ignore

        # LANÇA NO CAIXA USANDO A FUNCAO CENTRAL
        await registrar_movimento_caixa(
            db=db,
            caixa_id=caixa.id, # type: ignore
            loja_id=body.loja_id,
            tipo=TipoMovimentacao.SAIDA,
            valor=valor_saida, # <- AGORA É DECIMAL
            descricao=f"{nova_saida.descricao} #{str(saida_id)[:8]}",
            usuario_id=current_user.id, # type: ignore
            referencia_id=saida_id, # <- AGORA É UUID
            referencia_tipo='saida',
            forma_pagamento=body.forma_pagamento
        )

        await db.commit()
        await db.refresh(nova_saida)

        # ATUALIZA ESTATISTICAS
        await manager.broadcast_to_loja(
            str(body.loja_id),
            {"tipo": "stats.updated", "valor_saida": float(valor_saida), "acao": "add_saida"} # <- USA O CAST
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

    stmt = select(Saida).where(Saida.loja_id == loja_id).order_by(Saida.created_at.desc())
    result = await db.execute(stmt)
    saidas = result.scalars().all()
    return saidas
