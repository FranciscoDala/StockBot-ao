from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date
import traceback
import logging

logger = logging.getLogger(__name__)

from app.db.session import get_db
from app.models.caixa import Caixa, StatusCaixa
from app.models.movimentacao_caixa import MovimentacaoCaixa, TipoMovimentacao
from app.models.loja import Loja
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from app.models.role import UserRole
from app.schemas.caixa import CaixaAbrirIn, CaixaFecharIn, SangriaIn, CaixaResumoOut, MovimentacaoOut
from app.core.deps import get_current_user, verificar_acesso_loja
from app.core.security import verify_password

router = APIRouter()

def to_decimal(v) -> Decimal: # <- TROCA AQUI
    if v is None:
        return Decimal('0')
    return Decimal(str(v))

async def get_caixa_aberto_loja(db: AsyncSession, loja_id: UUID) -> Caixa | None:
    hoje = date.today()
    logger.info(f"[DEBUG] Buscando caixa aberto para loja_id={loja_id} na data={hoje}")
    stmt = select(Caixa).where(
        and_(
            Caixa.loja_id == loja_id,
            func.date(Caixa.data_caixa) == hoje,
            Caixa.status == StatusCaixa.ABERTO.value
        )
    )
    result = await db.execute(stmt)
    caixa = result.scalar_one_or_none()
    logger.info(f"[DEBUG] Caixa encontrado: {caixa.id if caixa else 'NENHUM'}")
    return caixa



async def registrar_movimento_caixa(
    db: AsyncSession, caixa_id: UUID, loja_id: UUID, tipo: TipoMovimentacao, valor: Decimal,
    descricao: str, usuario_id: UUID, referencia_id: UUID | None = None, referencia_tipo: str | None = None
):
    logger.info(f"[DEBUG] REGISTRANDO MOV: tipo={tipo.value} valor={valor} caixa={caixa_id}")
    caixa = await db.get(Caixa, caixa_id)
    if not caixa or caixa.status == StatusCaixa.FECHADO:
        logger.error(f"[DEBUG] ERRO: Tentou registrar movimento mas caixa fechado. caixa_id={caixa_id}")
        raise HTTPException(status_code=400, detail="Não é possível registrar: caixa fechado")

    mov = MovimentacaoCaixa(
        caixa_id=caixa.id,
        loja_id=loja_id,
        tipo=tipo.value,
        valor=to_decimal(valor),
        descricao=descricao,
        referencia_id=referencia_id,
        referencia_tipo=referencia_tipo,
        usuario_id=usuario_id,
        created_at=datetime.utcnow()
    )
    db.add(mov)

    valor = to_decimal(valor)
    caixa.total_entradas = to_decimal(caixa.total_entradas)
    caixa.total_saidas = to_decimal(caixa.total_saidas)
    caixa.saldo_abertura = to_decimal(caixa.saldo_abertura)

    # CORRECAO: ABERTURA NAO ENTRA COMO ENTRADA
    if tipo == TipoMovimentacao.ENTRADA:
        caixa.total_entradas += valor
    elif tipo in [TipoMovimentacao.SAIDA, TipoMovimentacao.SANGRIA]:
        caixa.total_saidas += valor
    # ABERTURA e FECHAMENTO so registram o movimento, nao mexem nos totais

    caixa.saldo_esperado = caixa.saldo_abertura + caixa.total_entradas - caixa.total_saidas
    logger.info(f"[DEBUG] Novo saldo_esperado: {caixa.saldo_esperado}")
    db.add(caixa)
    return caixa

# ROTA NOVA: RESUMO DO DIA SOMANDO TODOS OS CAIXAS
@router.get("/resumo-dia", response_model=CaixaResumoOut)
async def get_resumo_dia(loja_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    hoje = date.today()

    stmt_saldo = select(func.coalesce(func.sum(Caixa.saldo_abertura), 0)).where(
        and_(Caixa.loja_id == loja_id, func.date(Caixa.data_caixa) == hoje)
    )
    saldo_abertura = (await db.execute(stmt_saldo)).scalar_one()

    stmt_entradas = select(func.coalesce(func.sum(MovimentacaoCaixa.valor), 0)).where(
        and_(
            MovimentacaoCaixa.loja_id == loja_id,
            func.date(MovimentacaoCaixa.created_at) == hoje,
            MovimentacaoCaixa.tipo == TipoMovimentacao.ENTRADA.value
        )
    )
    entradas = (await db.execute(stmt_entradas)).scalar_one()

    stmt_saidas = select(func.coalesce(func.sum(MovimentacaoCaixa.valor), 0)).where(
        and_(
            MovimentacaoCaixa.loja_id == loja_id,
            func.date(MovimentacaoCaixa.created_at) == hoje,
            MovimentacaoCaixa.tipo.in_([TipoMovimentacao.SAIDA.value, TipoMovimentacao.SANGRIA.value])
        )
    )
    saidas = (await db.execute(stmt_saidas)).scalar_one()

    caixa_loja_aberto = await get_caixa_aberto_loja(db, loja_id) # <- MUDOU AQUI
    tem_caixa_aberto = caixa_loja_aberto is not None
    saldo_atual = to_decimal(saldo_abertura) + to_decimal(entradas) - to_decimal(saidas)

    return CaixaResumoOut(
        id=caixa_loja_aberto.id if caixa_loja_aberto else None, # <- MUDOU AQUI
        saldo_abertura=to_decimal(saldo_abertura),
        entradas_hoje=to_decimal(entradas),
        saidas_hoje=to_decimal(saidas),
        saldo_atual=saldo_atual,
        status=StatusCaixa.ABERTO if tem_caixa_aberto else StatusCaixa.FECHADO
    )

@router.get("/{caixa_id}/movimentacoes", response_model=list[MovimentacaoOut])
async def get_movimentacoes_caixa(caixa_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    caixa = await db.get(Caixa, caixa_id)
    if not caixa: raise HTTPException(status_code=404, detail="Caixa não encontrado")
    await verificar_acesso_loja(caixa.loja_id, db, current_user)
    stmt = select(MovimentacaoCaixa).where(MovimentacaoCaixa.caixa_id == caixa_id).order_by(MovimentacaoCaixa.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/abrir", status_code=status.HTTP_201_CREATED)
async def abrir_caixa(body: CaixaAbrirIn, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    logger.info(f"[DEBUG] ===== INICIANDO ABERTURA DE CAIXA =====")
    try:
        await verificar_acesso_loja(body.loja_id, db, current_user)

        # BLOQUEIA SE JÁ TEM 1 ABERTO NA LOJA
        if await get_caixa_aberto_loja(db, body.loja_id):
            raise HTTPException(status_code=400, detail="Já existe um caixa aberto para esta loja hoje")

        loja = await db.get(Loja, body.loja_id)
        if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")

        saldo_abertura_dec = to_decimal(body.saldo_abertura)
        novo_caixa = Caixa(
            loja_id=body.loja_id,
            data_caixa=date.today(),
            data_abertura=datetime.utcnow(),
            usuario_abertura_id=current_user.id, # continua salvando quem abriu pra auditoria
            saldo_abertura=saldo_abertura_dec,
            saldo_esperado=saldo_abertura_dec,
            total_entradas=0,
            total_saidas=0,
            status=StatusCaixa.ABERTO,
            observacao=body.observacao
        )
        db.add(novo_caixa)
        await db.flush()

        await registrar_movimento_caixa(
            db=db, caixa_id=novo_caixa.id, loja_id=body.loja_id, tipo=TipoMovimentacao.ABERTURA,
            valor=saldo_abertura_dec, descricao=f"Abertura de caixa: {saldo_abertura_dec}", usuario_id=current_user.id
        )

        await db.commit()
        await db.refresh(novo_caixa)
    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        logger.error(f"[DEBUG] ERRO 500 CRITICO: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao abrir caixa: {str(e)}")
    return {"message": "Caixa aberto com sucesso", "id": novo_caixa.id}



@router.post("/fechar/{caixa_id}")
async def fechar_caixa(caixa_id: UUID, body: CaixaFecharIn, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    caixa = await db.get(Caixa, caixa_id)
    if not caixa: raise HTTPException(status_code=404, detail="Caixa não encontrado")
    await verificar_acesso_loja(caixa.loja_id, db, current_user)
    if caixa.status == StatusCaixa.FECHADO: raise HTTPException(status_code=400, detail="Caixa já está fechado")

    try:
        saldo_contado_dec = to_decimal(body.saldo_contado)
        saldo_esperado_dec = to_decimal(caixa.saldo_esperado)

        # 1. PRIMEIRO REGISTRA A MOVIMENTACAO
        await registrar_movimento_caixa(
            db=db,
            caixa_id=caixa.id,
            loja_id=caixa.loja_id,
            tipo=TipoMovimentacao.FECHAMENTO, # <- precisa ter esse tipo no Enum
            valor=saldo_contado_dec,
            descricao=f"Fechamento de caixa: {saldo_contado_dec}",
            usuario_id=current_user.id
        )

        # 2. DEPOIS FECHA O CAIXA
        caixa.status = StatusCaixa.FECHADO
        caixa.data_fechamento = datetime.utcnow()
        caixa.usuario_fechamento_id = current_user.id
        caixa.saldo_contado = saldo_contado_dec
        caixa.diferenca = saldo_contado_dec - saldo_esperado_dec
        caixa.observacao = body.observacao

        await db.commit()
        await db.refresh(caixa)
    except Exception as e:
        await db.rollback()
        logger.error(f"[DEBUG] ERRO AO FECHAR CAIXA: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao fechar caixa: {e}")

    return {"message": "Caixa fechado com sucesso", "diferenca": float(caixa.diferenca or 0)}


@router.post("/sangria")
async def fazer_sangria(body: SangriaIn, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(body.loja_id, db, current_user)
    caixa = await get_caixa_aberto_loja(db, body.loja_id) # <- MUDOU AQUI
    if not caixa: raise HTTPException(status_code=400, detail="Não há caixa aberto para esta loja")
    if to_decimal(caixa.saldo_esperado) < to_decimal(body.valor): raise HTTPException(status_code=400, detail="Saldo insuficiente para sangria")
    try:
        await registrar_movimento_caixa(
            db=db, caixa_id=caixa.id, loja_id=body.loja_id, tipo=TipoMovimentacao.SANGRIA,
            valor=to_decimal(body.valor), descricao=body.descricao, usuario_id=current_user.id
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.error(f"[DEBUG] ERRO SANGRIA: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao registrar sangria: {e}")
    return {"message": "Sangria registrada com sucesso!"}

@router.get("/historico")
async def get_historico_caixa(
    loja_id: UUID,
    data: date, # <- 2026-07-22
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)

    # 1. Pega todos os caixas daquela data
    stmt_caixas = select(Caixa).where(
        and_(Caixa.loja_id == loja_id, func.date(Caixa.data_caixa) == data)
    ).order_by(Caixa.data_abertura)
    caixas = (await db.execute(stmt_caixas)).scalars().all()

    if not caixas:
        return {"caixas": [], "movimentacoes": []}

    ids_caixas = [c.id for c in caixas]

    # 2. Pega todas as movimentações desses caixas
    stmt_movs = select(MovimentacaoCaixa).where(
        MovimentacaoCaixa.caixa_id.in_(ids_caixas)
    ).order_by(MovimentacaoCaixa.created_at.desc())
    movs = (await db.execute(stmt_movs)).scalars().all()

    return {
        "caixas": caixas, # <- pra mostrar: João 08:00-12:00 Fechado
        "movimentacoes": movs # <- todas as movs do dia
    }
