from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.models.movimentacao_caixa import MovimentacaoCaixa
from app.models.caixa import Caixa
from app.models.usuario import Usuario
from app.models.venda import Venda # <- ADICIONA
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

    stmt = select(
        MovimentacaoCaixa,
        Venda.forma_pagamento # <- PEGA A FORMA DE PAGAMENTO
    ).outerjoin(
        Venda, and_(Venda.id == MovimentacaoCaixa.referencia_id, MovimentacaoCaixa.referencia_tipo == 'venda')
    ).where(
        MovimentacaoCaixa.caixa_id == caixa_id
    ).order_by(MovimentacaoCaixa.created_at.desc())

    result = await db.execute(stmt)
    resultados = result.all()

    # Precisa adaptar o retorno pro teu schema MovimentacaoCaixaOut
    movimentacoes = []
    for mov, forma_pagamento in resultados:
        mov_dict = {
            "id": mov.id,
            "caixa_id": mov.caixa_id,
            "loja_id": mov.loja_id,
            "tipo": mov.tipo,
            "valor": mov.valor,
            "descricao": mov.descricao,
            "referencia_id": mov.referencia_id,
            "referencia_tipo": mov.referencia_tipo,
            "usuario_id": mov.usuario_id,
            "created_at": mov.created_at,
            "forma_pagamento": forma_pagamento # <- ADICIONA ISSO NO SCHEMA
        }
        movimentacoes.append(mov_dict)

    return movimentacoes
