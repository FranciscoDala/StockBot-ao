from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from decimal import Decimal
from uuid import UUID
from datetime import date

from app.db.session import get_db
from app.models.caixa import Caixa, StatusCaixa # <- IMPORT DO MODEL
from app.models.movimentacao_caixa import MovimentacaoCaixa, TipoMovimentacao # <- IMPORT DO MODEL
from app.models.usuario import Usuario
from app.core.deps import get_current_user, require_role, get_current_loja_id
from app.schemas.caixa import ( # <- IMPORT DOS SCHEMAS
    CaixaOut,
    AbrirCaixaIn,
    SangriaCaixaIn,
    FecharCaixaIn,
    MovimentacaoCaixaOut
)
from app.schemas.usuario import Role
from app.websocket.manager import manager

router = APIRouter(prefix="/caixas", tags=["Caixa"])

async def get_caixa_aberto(db: AsyncSession, loja_id: UUID):
    hoje = date.today()
    stmt = select(Caixa).where(
        Caixa.loja_id == loja_id,
        Caixa.status == StatusCaixa.ABERTO,
        func.date(Caixa.data) == hoje
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

@router.post("/abrir", response_model=CaixaOut)
async def abrir_caixa(
    body: AbrirCaixaIn,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(Role.DONO, Role.GERENTE))
):
    if await get_caixa_aberto(db, body.loja_id):
        raise HTTPException(400, "Já existe um caixa aberto para hoje")

    caixa = Caixa(
        loja_id=body.loja_id,
        saldo_abertura=body.saldo_abertura,
        observacao=body.observacao,
        usuario_abertura_id=current_user.id
    )
    db.add(caixa)
    await db.commit()
    await db.refresh(caixa)

    await manager.broadcast_to_loja(str(body.loja_id), {"tipo": "caixa.updated"})
    return caixa

@router.post("/sangria", response_model=MovimentacaoCaixaOut)
async def fazer_sangria(
    body: SangriaCaixaIn,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(Role.DONO, Role.GERENTE))
):
    caixa = await get_caixa_aberto(db, body.loja_id)
    if not caixa:
        raise HTTPException(400, "Nenhum caixa aberto")

    mov = MovimentacaoCaixa(
        caixa_id=caixa.id,
        loja_id=body.loja_id,
        usuario_id=current_user.id,
        tipo=TipoMovimentacao.SANGRIA,
        valor=body.valor,
        descricao=body.descricao
    )
    db.add(mov)
    await db.commit()
    await db.refresh(mov)

    await manager.broadcast_to_loja(str(body.loja_id), {"tipo": "caixa.updated"})
    return mov

@router.post("/fechar", response_model=CaixaOut)
async def fechar_caixa(
    body: FecharCaixaIn,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(require_role(Role.DONO, Role.GERENTE))
):
    caixa = await get_caixa_aberto(db, body.loja_id)
    if not caixa:
        raise HTTPException(400, "Nenhum caixa aberto")

    # Calcula saldo final
    stmt = select(
        func.sum(MovimentacaoCaixa.valor).filter(MovimentacaoCaixa.tipo.in_([TipoMovimentacao.VENDA_DINHEIRO, TipoMovimentacao.ENTRADA])),
        func.sum(MovimentacaoCaixa.valor).filter(MovimentacaoCaixa.tipo.in_([TipoMovimentacao.SAIDA, TipoMovimentacao.SANGRIA]))
    ).where(MovimentacaoCaixa.caixa_id == caixa.id)
    result = await db.execute(stmt)
    entradas, saidas = result.one()
    entradas = entradas or 0
    saidas = saidas or 0

    saldo_fechamento = caixa.saldo_abertura + entradas - saidas
    diferenca = body.saldo_contado - saldo_fechamento

    caixa.status = StatusCaixa.FECHADO
    caixa.saldo_fechamento = saldo_fechamento
    caixa.saldo_contado = body.saldo_contado
    caixa.diferenca = diferenca
    caixa.observacao = body.observacao
    caixa.usuario_fechamento_id = current_user.id
    caixa.fechado_em = func.now()

    await db.commit()
    await db.refresh(caixa)

    await manager.broadcast_to_loja(str(body.loja_id), {"tipo": "caixa.updated"})
    return caixa

@router.get("/atual", response_model=CaixaOut)
async def get_caixa_atual(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    caixa = await get_caixa_aberto(db, loja_id)
    if not caixa:
        raise HTTPException(404, "Nenhum caixa aberto")
    return caixa
