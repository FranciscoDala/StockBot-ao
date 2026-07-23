from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from decimal import Decimal
from datetime import datetime, date

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

async def get_caixa_aberto(db: AsyncSession, loja_id: UUID) -> Caixa | None:
    hoje = date.today()
    stmt = select(Caixa).where(
        and_(
            Caixa.loja_id == loja_id,
            func.date(Caixa.data_caixa) == hoje,
            Caixa.status == StatusCaixa.ABERTO.value
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def get_dono_loja(db: AsyncSession, loja_id: UUID) -> Usuario | None:
    stmt = (select(Usuario).join(UsuarioLoja, UsuarioLoja.usuario_id == Usuario.id)
       .where(UsuarioLoja.loja_id == loja_id, UsuarioLoja.role == UserRole.DONO, UsuarioLoja.is_active == True))
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def verify_dono_password(db: AsyncSession, loja_id: UUID, senha: str):
    if not senha:
        raise HTTPException(status_code=403, detail="Senha do dono não informada")
    dono = await get_dono_loja(db, loja_id)
    if not dono:
        raise HTTPException(status_code=404, detail="Dono da loja não encontrado")
    if not verify_password(senha, dono.senha_hash):
        raise HTTPException(status_code=403, detail="Senha do DONO incorreta")

async def registrar_movimento_caixa(
    db: AsyncSession, loja_id: UUID, tipo: TipoMovimentacao, valor: Decimal,
    descricao: str, usuario_id: UUID, referencia_id: UUID | None = None, referencia_tipo: str | None = None
):
    caixa = await get_caixa_aberto(db, loja_id)
    if not caixa:
        raise HTTPException(status_code=400, detail="Não é possível registrar: caixa fechado")

    mov = MovimentacaoCaixa(
        caixa_id=caixa.id, loja_id=loja_id, tipo=tipo.value, valor=valor, descricao=descricao,
        referencia_id=referencia_id, referencia_tipo=referencia_tipo, usuario_id=usuario_id, created_at=datetime.utcnow()
    )
    db.add(mov)

    # CORRECAO 1: ESTORNO NAO ENTRA MAIS NO CALCULO
    if tipo in [TipoMovimentacao.ENTRADA, TipoMovimentacao.ABERTURA]:
        caixa.total_entradas += valor
    elif tipo in [TipoMovimentacao.SAIDA, TipoMovimentacao.SANGRIA]: # <- TIREI O ESTORNO
        caixa.total_saidas += valor

    caixa.saldo_esperado = caixa.saldo_abertura + caixa.total_entradas - caixa.total_saidas
    db.add(caixa)
    return caixa

@router.get("/resumo", response_model=CaixaResumoOut)
async def get_resumo_caixa(
    loja_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(loja_id, db, current_user)
    caixa = await get_caixa_aberto(db, loja_id)
    if not caixa:
        return CaixaResumoOut(
            id=None, saldo_abertura=Decimal(0), entradas_hoje=Decimal(0),
            saidas_hoje=Decimal(0), saldo_atual=Decimal(0), status=StatusCaixa.FECHADO
        )
    return CaixaResumoOut(
        id=caixa.id, saldo_abertura=caixa.saldo_abertura, entradas_hoje=caixa.total_entradas,
        saidas_hoje=caixa.total_saidas, saldo_atual=caixa.saldo_esperado, status=caixa.status
    )

@router.get("/{caixa_id}/movimentacoes", response_model=list[MovimentacaoOut])
async def get_movimentacoes_caixa(
    caixa_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    caixa = await db.get(Caixa, caixa_id)
    if not caixa:
        raise HTTPException(status_code=404, detail="Caixa não encontrado")
    await verificar_acesso_loja(caixa.loja_id, db, current_user)
    stmt = select(MovimentacaoCaixa).where(MovimentacaoCaixa.caixa_id == caixa_id).order_by(MovimentacaoCaixa.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/abrir", status_code=status.HTTP_201_CREATED)
async def abrir_caixa(
    body: CaixaAbrirIn,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(body.loja_id, db, current_user)
    if await get_caixa_aberto(db, body.loja_id):
        raise HTTPException(status_code=400, detail="Já existe um caixa aberto para hoje")

    loja = await db.get(Loja, body.loja_id)
    if not loja:
        raise HTTPException(status_code=404, detail="Loja não encontrada")

    try:
        novo_caixa = Caixa(
            loja_id=body.loja_id,
            data_caixa=date.today(),
            data_abertura=datetime.utcnow(),
            usuario_abertura_id=current_user.id,
            saldo_abertura=body.saldo_abertura,
            saldo_esperado=body.saldo_abertura,
            status=StatusCaixa.ABERTO,
            observacao=body.observacao
        )
        db.add(novo_caixa)
        await db.flush()

        await registrar_movimento_caixa(
            db=db, loja_id=body.loja_id, tipo=TipoMovimentacao.ABERTURA, valor=body.saldo_abertura,
            descricao=f"Abertura de caixa: {body.saldo_abertura}", usuario_id=current_user.id
        )

        await db.commit()
        await db.refresh(novo_caixa)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Já existe caixa para esta data")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao abrir caixa: {e}")

    return {"message": "Caixa aberto com sucesso", "id": novo_caixa.id}

@router.post("/fechar/{caixa_id}")
async def fechar_caixa(
    caixa_id: UUID,
    body: CaixaFecharIn,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    caixa = await db.get(Caixa, caixa_id)
    if not caixa:
        raise HTTPException(status_code=404, detail="Caixa não encontrado")
    await verificar_acesso_loja(caixa.loja_id, db, current_user)
    if caixa.status == StatusCaixa.FECHADO:
        raise HTTPException(status_code=400, detail="Caixa já está fechado")

    await verify_dono_password(db, caixa.loja_id, body.senha_dono)

    try:
        caixa.status = StatusCaixa.FECHADO
        caixa.data_fechamento = datetime.utcnow()
        caixa.usuario_fechamento_id = current_user.id
        caixa.saldo_contado = body.saldo_contado
        caixa.diferenca = body.saldo_contado - caixa.saldo_esperado
        caixa.observacao = body.observacao

        # CORRECAO 2: FECHAMENTO USA ESTORNO E NAO ESTOURA SAIDAS
        await registrar_movimento_caixa(
            db=db, loja_id=caixa.loja_id, tipo=TipoMovimentacao.ESTORNO, valor=caixa.saldo_esperado,
            descricao="Fechamento de caixa", usuario_id=current_user.id
        )
        await db.commit()
        await db.refresh(caixa)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao fechar caixa: {e}")

    return {"message": "Caixa fechado com sucesso", "diferenca": float(caixa.diferenca or 0)}

@router.post("/sangria")
async def fazer_sangria(
    body: SangriaIn,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    await verificar_acesso_loja(body.loja_id, db, current_user)
    caixa = await get_caixa_aberto(db, body.loja_id)
    if not caixa:
        raise HTTPException(status_code=400, detail="Não existe caixa aberto para hoje")
    if caixa.saldo_esperado < body.valor:
        raise HTTPException(status_code=400, detail="Saldo insuficiente para sangria")

    try:
        await registrar_movimento_caixa(
            db=db, loja_id=body.loja_id, tipo=TipoMovimentacao.SANGRIA, valor=body.valor,
            descricao=body.descricao, usuario_id=current_user.id
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao registrar sangria: {e}")

    return {"message": "Sangria registrada com sucesso!"}
