from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from app.db.session import get_db # <- IGUAL AO LOJA.PY
from app.models.saida import Saida
from app.models.usuario import Usuario
from app.core.deps import get_current_user, verificar_acesso_loja

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
    data_saida: datetime

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
    return nova_saida

@router.get("", response_model=list[SaidaOut])
async def listar_saidas(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)

    stmt = select(Saida).where(Saida.loja_id == loja_id).order_by(Saida.data_saida.desc())
    result = await db.execute(stmt)
    saidas = result.scalars().all()
    return saidas
