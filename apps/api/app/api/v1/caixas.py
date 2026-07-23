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

def to_decimal(v) -> Decimal:
    return Decimal(str(v or 0))

async def get_caixa_aberto_usuario(db: AsyncSession, loja_id: UUID, usuario_id: UUID) -> Caixa | None: # <- AGORA É POR USUARIO
    hoje = date.today()
    logger.info(f"[DEBUG] Buscando caixa aberto para loja_id={loja_id} usuario={usuario_id} na data={hoje}")
    stmt = select(Caixa).where(
        and_(
            Caixa.loja_id == loja_id,
            Caixa.usuario_abertura_id == usuario_id, # <- FILTRO POR USUARIO
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

    if tipo in [TipoMovimentacao.ENTRADA, TipoMovimentacao.ABERTURA]:
        caixa.total_entradas += valor
    elif tipo in [TipoMovimentacao.SAIDA, TipoMovimentacao.SANGRIA, TipoMovimentacao.ESTORNO]: # <- ESTORNO CONTA COMO SAIDA
        caixa.total_saidas += valor

    caixa.saldo_esperado = caixa.saldo_abertura + caixa.total_entradas - caixa.total_saidas
    logger.info(f"[DEBUG] Novo saldo_esperado: {caixa.saldo_esperado}")
    db.add(caixa)
    return caixa

# ROTA NOVA: RESUMO DO DIA SOMANDO TODOS OS CAIXAS
@router.get("/resumo-dia", response_model=CaixaResumoOut)
async def get_resumo_dia(loja_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    hoje = date.today()

    stmt = select(
        func.coalesce(func.sum(Caixa.saldo_abertura), 0),
        func.coalesce(func.sum(Caixa.total_entradas), 0),
        func.coalesce(func.sum(Caixa.total_saidas), 0),
    ).where(and_(Caixa.loja_id == loja_id, func.date(Caixa.data_caixa) == hoje))
    result = await db.execute(stmt)
    saldo_abertura, entradas, saidas = result.one()

    # Verifica se o usuario logado tem caixa aberto
    meu_caixa_aberto = await get_caixa_aberto_usuario(db, loja_id, current_user.id)
    tem_caixa_aberto = meu_caixa_aberto is not None

    saldo_atual = to_decimal(saldo_abertura) + to_decimal(entradas) - to_decimal(saidas)

    return CaixaResumoOut(
        id=meu_caixa_aberto.id if meu_caixa_aberto else None, # <- manda o id do meu caixa pra poder fechar
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
        if await get_caixa_aberto_usuario(db, body.loja_id, current_user.id): # <- VALIDA POR USUARIO
            raise HTTPException(status_code=400, detail="Você já possui um caixa aberto para hoje")

        loja = await db.get(Loja, body.loja_id)
        if not loja: raise HTTPException(status_code=404, detail="Loja não encontrada")

        saldo_abertura_dec = to_decimal(body.saldo_abertura)
        novo_caixa = Caixa(
            loja_id=body.loja_id,
            data_caixa=date.today(),
            data_abertura=datetime.utcnow(),
            usuario_abertura_id=current_user.id,
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
    if caixa.usuario_abertura_id!= current_user.id: raise HTTPException(status_code=403, detail="Você só pode fechar seu próprio caixa") # <- SEGURANÇA
    await verificar_acesso_loja(caixa.loja_id, db, current_user)
    if caixa.status == StatusCaixa.FECHADO: raise HTTPException(status_code=400, detail="Caixa já está fechado")

    try:
        await registrar_movimento_caixa(
            db=db, caixa_id=caixa.id, loja_id=caixa.loja_id, tipo=TipoMovimentacao.ESTORNO,
            valor=to_decimal(caixa.saldo_esperado), descricao="Fechamento de caixa", usuario_id=current_user.id
        )

        caixa.status = StatusCaixa.FECHADO
        caixa.data_fechamento = datetime.utcnow()
        caixa.usuario_fechamento_id = current_user.id
        caixa.saldo_contado = to_decimal(body.saldo_contado)
        caixa.diferenca = to_decimal(body.saldo_contado) - to_decimal(caixa.saldo_esperado)
        caixa.observacao = body.observacao

        await db.commit()
        await db.refresh(caixa)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao fechar caixa: {e}")
    return {"message": "Caixa fechado com sucesso", "diferenca": float(caixa.diferenca or 0)}

@router.post("/sangria")
async def fazer_sangria(body: SangriaIn, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(body.loja_id, db, current_user)
    caixa = await get_caixa_aberto_usuario(db, body.loja_id, current_user.id) # <- PEGA O CAIXA DO USUARIO
    if not caixa: raise HTTPException(status_code=400, detail="Você não possui caixa aberto")
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
