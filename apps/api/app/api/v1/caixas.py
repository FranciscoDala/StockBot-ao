from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date, timedelta
import traceback
import logging

logger = logging.getLogger(__name__)

from app.db.session import get_db
from app.models.caixa import Caixa, StatusCaixa
from app.models.movimentacao_caixa import MovimentacaoCaixa, TipoMovimentacao
from app.models.loja import Loja
from app.models.usuario import Usuario
from app.models.venda import Venda # <- ADICIONA ESSA LINHA
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
            Caixa.loja_id == loja_id, # type: ignore
            func.date(Caixa.data_caixa) == hoje, # type: ignore
            Caixa.status == StatusCaixa.ABERTO # <- SEM.value
        )
    )
    result = await db.execute(stmt)
    caixa = result.scalar_one_or_none()
    logger.info(f"[DEBUG] Caixa encontrado: {caixa.id if caixa else 'NENHUM'}") # type: ignore
    return caixa


async def registrar_movimento_caixa(
    db: AsyncSession, caixa_id: UUID, loja_id: UUID, tipo: TipoMovimentacao, valor: Decimal,
    descricao: str, usuario_id: UUID, referencia_id: UUID | None = None, referencia_tipo: str | None = None,
    forma_pagamento: str | None = None # <- ADICIONADO
):
    logger.info(f"[DEBUG] REGISTRANDO MOV: tipo={tipo.value} valor={valor} caixa={caixa_id} forma={forma_pagamento}")
    caixa = await db.get(Caixa, caixa_id)
    if not caixa or caixa.status == StatusCaixa.FECHADO: # <- SEM.value # type: ignore
        logger.error(f"[DEBUG] ERRO: Tentou registrar movimento mas caixa fechado. caixa_id={caixa_id}")
        raise HTTPException(status_code=400, detail="Não é possível registrar: caixa fechado")

    mov = MovimentacaoCaixa(
        caixa_id=caixa.id, # type: ignore
        loja_id=loja_id, # type: ignore
        tipo=tipo.value,
        valor=to_decimal(valor),
        descricao=descricao,
        referencia_id=referencia_id,
        referencia_tipo=referencia_tipo,
        usuario_id=usuario_id, # type: ignore
        forma_pagamento=forma_pagamento, # <- ADICIONADO: salva direto na movimentacao
        created_at=datetime.utcnow()
    )
    db.add(mov)

    valor_dec = to_decimal(valor)

    # FORÇA CAST PRA PYLANCE PARAR DE RECLAMAR
    total_entradas = to_decimal(caixa.total_entradas) # type: ignore
    total_saidas = to_decimal(caixa.total_saidas) # type: ignore
    saldo_abertura = to_decimal(caixa.saldo_abertura) # type: ignore

    # CORRECAO: SO SOMA EM TOTAL_ENTRADAS SE FOR DINHEIRO
    if tipo == TipoMovimentacao.ENTRADA:
        forma_para_soma = forma_pagamento # <- usa o param que veio
        if not forma_para_soma and referencia_tipo == 'venda' and referencia_id: # <- fallback pra vendas antigas
            stmt_venda = select(Venda.forma_pagamento).where(Venda.id == referencia_id) # type: ignore
            result = await db.execute(stmt_venda)
            forma_para_soma = result.scalar_one_or_none()

        if forma_para_soma and forma_para_soma.lower() == 'dinheiro':
            total_entradas += valor_dec
        elif not forma_para_soma: # se for suprimento/abertura sem forma
            total_entradas += valor_dec

    elif tipo in [TipoMovimentacao.SAIDA, TipoMovimentacao.SANGRIA]:
        total_saidas += valor_dec

    # ATRIBUI DE VOLTA
    caixa.total_entradas = total_entradas # type: ignore
    caixa.total_saidas = total_saidas # type: ignore
    caixa.saldo_esperado = saldo_abertura + total_entradas - total_saidas # type: ignore

    logger.info(f"[DEBUG] Novo saldo_esperado: {caixa.saldo_esperado}") # type: ignore
    db.add(caixa)
    return caixa




# ROTA NOVA: RESUMO DO DIA SOMANDO TODOS OS CAIXAS
@router.get("/resumo-dia", response_model=CaixaResumoOut)
async def get_resumo_dia(loja_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)
    hoje = date.today()

    stmt_saldo = select(func.coalesce(func.sum(Caixa.saldo_abertura), 0)).where( # type: ignore
        and_(Caixa.loja_id == loja_id, func.date(Caixa.data_caixa) == hoje) # type: ignore
    )
    saldo_abertura = (await db.execute(stmt_saldo)).scalar_one()

    stmt_entradas = select(func.coalesce(func.sum(MovimentacaoCaixa.valor), 0)).where( # type: ignore
        and_(
            MovimentacaoCaixa.loja_id == loja_id, # type: ignore
            func.date(MovimentacaoCaixa.created_at) == hoje, # type: ignore
            MovimentacaoCaixa.tipo == TipoMovimentacao.ENTRADA.value # type: ignore
        )
    )
    entradas = (await db.execute(stmt_entradas)).scalar_one()

    # CORRIGIDO: agora soma SAIDA + SANGRIA + FECHAMENTO + ESTORNO
    stmt_saidas = select(func.coalesce(func.sum(MovimentacaoCaixa.valor), 0)).where( # type: ignore
        and_(
            MovimentacaoCaixa.loja_id == loja_id, # type: ignore
            func.date(MovimentacaoCaixa.created_at) == hoje, # type: ignore
            MovimentacaoCaixa.tipo.in_([ # type: ignore
                TipoMovimentacao.SAIDA.value,
                TipoMovimentacao.SANGRIA.value,
                TipoMovimentacao.FECHAMENTO.value,
                TipoMovimentacao.ESTORNO.value
            ])
        )
    )
    saidas = (await db.execute(stmt_saidas)).scalar_one()

    caixa_loja_aberto = await get_caixa_aberto_loja(db, loja_id)
    tem_caixa_aberto = caixa_loja_aberto is not None
    saldo_atual = to_decimal(saldo_abertura) + to_decimal(entradas) - to_decimal(saidas)

    return CaixaResumoOut(
        id=caixa_loja_aberto.id if caixa_loja_aberto else None, # type: ignore
        saldo_abertura=to_decimal(saldo_abertura),
        entradas_hoje=to_decimal(entradas),
        saidas_hoje=to_decimal(saidas),
        saldo_atual=saldo_atual,
        status=(StatusCaixa.ABERTO.value if tem_caixa_aberto else StatusCaixa.FECHADO.value) # type: ignore
    )

from datetime import datetime, date

@router.get("/resumo-mes")
async def get_resumo_mes(loja_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(loja_id, db, current_user)

    hoje = date.today()
    primeiro_dia_mes = hoje.replace(day=1) # 2026-07-01

    stmt_saidas = select(func.coalesce(func.sum(MovimentacaoCaixa.valor), 0)).where( # type: ignore
        and_(
            MovimentacaoCaixa.loja_id == loja_id, # type: ignore
            func.date(MovimentacaoCaixa.created_at) >= primeiro_dia_mes, # type: ignore
            func.date(MovimentacaoCaixa.created_at) <= hoje, # type: ignore
            MovimentacaoCaixa.tipo.in_([ # type: ignore
                TipoMovimentacao.SAIDA.value,
                TipoMovimentacao.SANGRIA.value,
                TipoMovimentacao.FECHAMENTO.value,
                TipoMovimentacao.ESTORNO.value
            ])
        )
    )
    saidas_mes = (await db.execute(stmt_saidas)).scalar_one()

    # Bônus: já manda também entradas e faturamento do mês
    stmt_entradas = select(func.coalesce(func.sum(MovimentacaoCaixa.valor), 0)).where( # type: ignore
        and_(
            MovimentacaoCaixa.loja_id == loja_id, # type: ignore
            func.date(MovimentacaoCaixa.created_at) >= primeiro_dia_mes, # type: ignore
            func.date(MovimentacaoCaixa.created_at) <= hoje, # type: ignore
            MovimentacaoCaixa.tipo == TipoMovimentacao.ENTRADA.value # type: ignore
        )
    )
    entradas_mes = (await db.execute(stmt_entradas)).scalar_one()

    return {
        "saidas_mes": float(saidas_mes),
        "entradas_mes": float(entradas_mes),
        "faturamento_mes": float(entradas_mes)
    }

@router.get("/{caixa_id}/movimentacoes", response_model=list[MovimentacaoOut])
async def get_movimentacoes_caixa(caixa_id: UUID, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    caixa = await db.get(Caixa, caixa_id)
    if not caixa: raise HTTPException(status_code=404, detail="Caixa não encontrado")
    await verificar_acesso_loja(caixa.loja_id, db, current_user) # type: ignore
    stmt = select(MovimentacaoCaixa).where(MovimentacaoCaixa.caixa_id == caixa_id).order_by(MovimentacaoCaixa.created_at.desc()) # type: ignore
    result = await db.execute(stmt)
    return list(result.scalars().all())

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
            loja_id=body.loja_id, # type: ignore
            data_caixa=date.today(),
            data_abertura=datetime.utcnow(),
            usuario_abertura_id=current_user.id, # type: ignore
            saldo_abertura=saldo_abertura_dec,
            saldo_esperado=saldo_abertura_dec,
            total_entradas=Decimal('0'),
            total_saidas=Decimal('0'),
            status=StatusCaixa.ABERTO.value, # <- COM.value
            observacao=body.observacao
        )
        db.add(novo_caixa)
        await db.flush()

        await registrar_movimento_caixa(
            db=db, caixa_id=novo_caixa.id, loja_id=body.loja_id, tipo=TipoMovimentacao.ABERTURA, # type: ignore
            valor=saldo_abertura_dec, descricao=f"Abertura de caixa: {saldo_abertura_dec}", usuario_id=current_user.id # type: ignore
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
    return {"message": "Caixa aberto com sucesso", "id": novo_caixa.id} # type: ignore

@router.post("/fechar/{caixa_id}")
async def fechar_caixa(caixa_id: UUID, body: CaixaFecharIn, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    caixa = await db.get(Caixa, caixa_id)
    if not caixa: raise HTTPException(status_code=404, detail="Caixa não encontrado")
    await verificar_acesso_loja(caixa.loja_id, db, current_user) # type: ignore
    if caixa.status == StatusCaixa.FECHADO: raise HTTPException(status_code=400, detail="Caixa já está fechado") # type: ignore

    try:
        saldo_contado_dec = to_decimal(body.saldo_contado)
        saldo_esperado_dec = to_decimal(caixa.saldo_esperado) # type: ignore

        # 1. PRIMEIRO REGISTRA A MOVIMENTACAO
        await registrar_movimento_caixa(
            db=db,
            caixa_id=caixa.id, # type: ignore
            loja_id=caixa.loja_id, # type: ignore
            tipo=TipoMovimentacao.FECHAMENTO,
            valor=saldo_contado_dec,
            descricao=f"Fechamento de caixa: {saldo_contado_dec}",
            usuario_id=current_user.id # type: ignore
        )

        # 2. DEPOIS FECHA O CAIXA
        caixa.status = StatusCaixa.FECHADO.value # type: ignore
        caixa.data_fechamento = datetime.utcnow() # type: ignore
        caixa.usuario_fechamento_id = current_user.id # type: ignore
        caixa.saldo_contado = saldo_contado_dec # type: ignore
        caixa.diferenca = saldo_contado_dec - saldo_esperado_dec # type: ignore
        caixa.observacao = body.observacao # type: ignore

        await db.commit()
        await db.refresh(caixa)
    except Exception as e:
        await db.rollback()
        logger.error(f"[DEBUG] ERRO AO FECHAR CAIXA: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Erro ao fechar caixa: {e}")

    return {"message": "Caixa fechado com sucesso", "diferenca": float(caixa.diferenca or 0)} # type: ignore

@router.post("/sangria")
async def fazer_sangria(body: SangriaIn, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    await verificar_acesso_loja(body.loja_id, db, current_user)
    caixa = await get_caixa_aberto_loja(db, body.loja_id)
    if not caixa: raise HTTPException(status_code=400, detail="Não há caixa aberto para esta loja")

    # CALCULA APENAS O DINHEIRO DISPONIVEL NO CAIXA
    saldo_dinheiro = to_decimal(caixa.saldo_abertura) + to_decimal(caixa.total_entradas) - to_decimal(caixa.total_saidas) # type: ignore

    if saldo_dinheiro < to_decimal(body.valor):
        raise HTTPException(
            status_code=400,
            detail=f"Saldo insuficiente para sangria. Disponível em dinheiro: {saldo_dinheiro}"
        )

    try:
        await registrar_movimento_caixa(
            db=db, caixa_id=caixa.id, loja_id=body.loja_id, tipo=TipoMovimentacao.SANGRIA, # type: ignore
            valor=to_decimal(body.valor), descricao=body.descricao, usuario_id=current_user.id # type: ignore
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
    data: date,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    from app.models.venda import Venda

    await verificar_acesso_loja(loja_id, db, current_user)

    stmt_caixas = select(Caixa).options(selectinload(Caixa.usuario_abertura)).where( # type: ignore
        and_(Caixa.loja_id == loja_id, func.date(Caixa.data_caixa) == data) # type: ignore
    ).order_by(Caixa.data_abertura) # type: ignore
    caixas = (await db.execute(stmt_caixas)).scalars().all()

    if not caixas:
        return {"caixas": [], "movimentacoes": [], "resumo": {}}

    ids_caixas = [c.id for c in caixas] # type: ignore

    stmt_movs = select(
        MovimentacaoCaixa,
        Venda.forma_pagamento
    ).outerjoin(
        Venda, and_(Venda.id == MovimentacaoCaixa.referencia_id, MovimentacaoCaixa.referencia_tipo == 'venda') # type: ignore
    ).where(
        MovimentacaoCaixa.caixa_id.in_(ids_caixas) # type: ignore
    ).order_by(MovimentacaoCaixa.created_at.desc()) # type: ignore

    resultados = (await db.execute(stmt_movs)).all()

    movimentacoes = []
    total_cash = Decimal('0')
    total_tpa = Decimal('0')
    total_saidas = Decimal('0')

    tipos_entrada = [TipoMovimentacao.ENTRADA.value, TipoMovimentacao.ABERTURA.value, TipoMovimentacao.SUPRIMENTO.value] # <- ADICIONADO
    tipos_saida = [TipoMovimentacao.SAIDA.value, TipoMovimentacao.SANGRIA.value, TipoMovimentacao.FECHAMENTO.value, TipoMovimentacao.ESTORNO.value] # <- ADICIONADO

    for mov, forma_pagamento in resultados:
        val = to_decimal(mov.valor)

        # PROTECAO 1: FORCA PRA STRING E MINUSCULA
        forma = str(forma_pagamento or "").lower()

        movimentacoes.append({
            "id": str(mov.id),
            "tipo": mov.tipo,
            "valor": float(val),
            "descricao": mov.descricao,
            "created_at": mov.created_at.isoformat(),
            "forma_pagamento": forma_pagamento
        })

        # CALCULO DO RESUMO - AGORA COM TODOS OS TIPOS
        if mov.tipo in tipos_entrada: # <- MUDOU
            if forma == 'dinheiro' or forma == 'cash':
                total_cash += val
            elif forma in ['tpa', 'transferencia', 'pix', 'cartao']:
                total_tpa += val
            else: # suprimento/abertura sem forma
                total_cash += val
        elif mov.tipo in tipos_saida: # <- MUDOU: AGORA TEM FECHAMENTO E ESTORNO
            total_saidas += val

    caixas_serializados = [
        {
            "id": str(c.id), # type: ignore
            "usuario_nome": c.usuario_abertura.nome if c.usuario_abertura else "Sistema", # type: ignore
            "data_abertura": c.data_abertura.isoformat() if c.data_abertura else None, # type: ignore
            "data_fechamento": c.data_fechamento.isoformat() if c.data_fechamento else None, # type: ignore
            "saldo_abertura": float(c.saldo_abertura), # type: ignore
            "saldo_contado": float(c.saldo_contado) if c.saldo_contado else None, # type: ignore
            "status": c.status # type: ignore
        }
        for c in caixas
    ]

    return {
        "caixas": caixas_serializados,
        "movimentacoes": movimentacoes,
        "resumo": {
            "cash_em_mao": float(total_cash),
            "tpa_transferencia": float(total_tpa),
            "saidas_sangrias": float(total_saidas),
            "faturamento_total": float(total_cash + total_tpa)
        }
    }
