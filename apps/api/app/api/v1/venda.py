import logging
from fastapi import APIRouter, Depends, status, Query, BackgroundTasks, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy import select, func, and_
from datetime import date
from typing import List
from uuid import UUID
from decimal import Decimal

from app.core.deps import get_current_user, require_role, get_current_loja_id
from app.schemas.usuario import Role
from app.models.usuario import Usuario
from app.models.venda import Venda
from app.models.itens_venda import ItemVenda
from app.models.produto import Produto
from app.models.loja import Loja
from app.models.caixa import Caixa, StatusCaixa
from app.models.movimentacao_caixa import TipoMovimentacao
from app.db.session import get_db
from app.schemas.venda import VendaCreate, VendaRead
from app.services.venda import criar_venda, estornar_venda_service
from app.services.whatsapp import enviar_msg_venda
from app.websocket.manager import manager
from app.api.v1.caixas import registrar_movimento_caixa

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=VendaRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE, Role.VENDEDOR))])
async def criar_venda_endpoint(
    venda_in: VendaCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id: UUID = Depends(get_current_loja_id)
):
    venda = await criar_venda(db=db, venda_in=venda_in, usuario=current_user, loja_id=loja_id)

    if venda and venda.itens:
        # AJUSTE 1: FORÇA RECIBO SEM IVA - SETA DIRETO NO MODEL PRA NÃO DAR ERRO NO SCHEMA
        venda.tipo_documento = "RECIBO"
        venda.serie = "REC"
        venda.numero_fatura = None
        venda.valor_iva = Decimal(0)
        venda.subtotal = venda.total

        await db.commit() # 1. SALVA PRIMEIRO PRA GARANTIR DADOS NO BANCO

        for item in venda.itens:
            produto_id = item.produto_id
            nome_produto = item.nome_produto
            produto_db = await db.get(Produto, produto_id)
            if produto_db and produto_db.controla_estoque:
                await db.refresh(produto_db) # 2. PEGA ESTOQUE ATUALIZADO DO BANCO
                try: # AJUSTE 2: BLINDA O BROADCAST PRA NÃO QUEBRAR SEM REDIS
                    await manager.broadcast_to_loja(
                        str(loja_id),
                        {"tipo": "stock.updated", "produto_id": str(produto_id), "nome_produto": nome_produto, "novo_estoque": produto_db.estoque}
                    )
                except Exception as e:
                    logger.warning(f"WS Broadcast falhou: {e}")

        try: # AJUSTE 3: BLINDA TAMBEM
            await manager.broadcast_to_loja(
                str(loja_id),
                {"tipo": "stats.updated", "valor_venda": float(venda.total), "total_itens": venda.total_itens, "acao": "add"}
            )
        except Exception as e:
            logger.warning(f"WS Broadcast falhou: {e}")

        # 3. LANÇA NO CAIXA TODA VENDA - DINHEIRO, TPA, PIX, ETC
        try:
            hoje = date.today()
            stmt_caixa = select(Caixa).where(
                and_(
                    Caixa.loja_id == loja_id,
                    Caixa.status == StatusCaixa.ABERTO,
                    func.date(Caixa.data_caixa) == hoje
                )
            )
            result_caixa = await db.execute(stmt_caixa)
            caixa_aberto = result_caixa.scalar_one_or_none()

            logger.info(f"[VENDA] Caixa encontrado: {caixa_aberto.id if caixa_aberto else 'NENHUM'}")

            if caixa_aberto:
                await registrar_movimento_caixa(
                    db=db,
                    caixa_id=UUID(str(caixa_aberto.id)),
                    loja_id=loja_id,
                    tipo=TipoMovimentacao.ENTRADA,
                    valor=Decimal(str(venda.total)),
                    descricao=f"Venda #{str(venda.id)[:8]} - {venda.forma_pagamento}",
                    usuario_id=current_user.id,
                    referencia_id=venda.id,
                    referencia_tipo='venda',
                    forma_pagamento=venda.forma_pagamento
                )
                try: await manager.broadcast_to_loja(str(loja_id), {"tipo": "caixa.updated"})
                except Exception as e: logger.warning(f"WS Broadcast falhou: {e}")
            else:
                logger.warning(f"AVISO CAIXA: Nenhum caixa aberto HOJE para venda {venda.id}")

        except Exception as e:
            logger.error(f"ERRO AO LANÇAR NO CAIXA: {e}", exc_info=True)

    if venda:
        background_tasks.add_task(enviar_msg_venda, db, loja_id, venda.id)
    return venda

@router.get("/", response_model=List[VendaRead], dependencies=[Depends(require_role(Role.DONO, Role.GERENTE, Role.VENDEDOR))])
async def get_vendas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    loja_id_param: UUID | None = Query(None, alias="loja_id"),
    loja_id_token: UUID = Depends(get_current_loja_id),
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    vendedor_id: UUID | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(5000, ge=1, le=5000)
):
    loja_id_usar = loja_id_param or loja_id_token
    offset = (page - 1) * limit

    query = (
        select(Venda)
     .options(
            joinedload(Venda.usuario),
            joinedload(Venda.itens).joinedload(ItemVenda.produto)
        )
     .where(Venda.loja_id == loja_id_usar)
     .order_by(Venda.created_at.desc())
     .limit(limit)
     .offset(offset)
    )

    if data_inicio:
        query = query.where(Venda.created_at >= data_inicio)
    if data_fim:
        query = query.where(Venda.created_at <= data_fim)
    if vendedor_id:
        query = query.where(Venda.usuario_id == vendedor_id)

    result = await db.execute(query)
    vendas_db = result.scalars().unique().all()

    vendas_response = []
    for v in vendas_db:
        itens = []
        for i in v.itens:
            itens.append({
                "id": i.id,
                "venda_id": i.venda_id,
                "produto_id": i.produto_id,
                "loja_id": i.loja_id,
                "nome_produto": i.produto.nome if i.produto else "Produto Removido",
                "quantidade": i.quantidade,
                "preco_unitario": i.preco_unitario,
                "subtotal": i.subtotal,
            })

        vendas_response.append({
            "id": v.id,
            "loja_id": v.loja_id,
            "usuario_id": v.usuario_id,
            "nome_vendedor": v.usuario.nome if v.usuario else "Sistema",
            "total": v.total,
            "total_itens": v.total_itens,
            "forma_pagamento": v.forma_pagamento,
            "valor_recebido": v.valor_recebido,
            "troco": v.troco,
            "status": v.status,
            "data_venda": v.created_at,
            "itens": itens
        })

    return vendas_response # type: ignore

@router.get("/{venda_id}/imprimir", response_class=HTMLResponse)
async def imprimir_venda(
    venda_id: UUID,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id)
):
    # Busca a venda com itens e loja
    stmt = select(Venda).options(
        selectinload(Venda.itens).selectinload(ItemVenda.produto),
        selectinload(Venda.loja),
        selectinload(Venda.usuario)
    ).where(Venda.id == venda_id, Venda.loja_id == loja_id)

    result = await db.execute(stmt)
    venda = result.scalar_one_or_none()

    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")

    # AJUSTE 4: HTML RECIBO 80mm SIMPLES
    itens_html = ""
    for item in venda.itens:
        nome = item.produto.nome if item.produto else "Produto Removido"
        itens_html += f"""<tr><td>{nome}</td><td style="text-align:center">{item.quantidade}</td><td style="text-align:right">{item.subtotal:.2f} KZ</td></tr>"""

    html_content = f"""<!DOCTYPE html><html lang="pt-AO"><head><meta charset="UTF-8"><title>RECIBO #{str(venda.id)[:8]}</title>
    <style>body{{font-family:Arial,sans-serif;padding:5px;width:80mm;margin:0 auto;font-size:11px}}.center{{text-align:center}}.header h2{{margin:0;font-size:16px}}table{{width:100%;border-collapse:collapse;margin-top:8px}}th,td{{padding:2px 0}}th{{border-bottom:1px dashed #000}}.total{{font-weight:bold;font-size:14px;text-align:right;border-top:1px dashed #000;padding-top:5px;margin-top:5px}}.footer{{text-align:center;margin-top:10px;font-size:10px}}@media print{{body{{margin:0}}}}</style>
    </head><body onload="window.print()">
        <div class="center header"><h2>{venda.loja.nome if venda.loja else 'MINHA LOJA'}</h2><p>RECIBO DE VENDA</p><p>Nº: {str(venda.id)[:8]} | {venda.created_at.strftime('%d/%m/%Y %H:%M')}</p><p>Vendedor: {venda.usuario.nome if venda.usuario else 'Sistema'}</p></div>
        <table><thead><tr><th>Item</th><th>Qtd</th><th>Total</th></tr></thead><tbody>{itens_html}</tbody></table>
        <div class="total">TOTAL: {venda.total:.2f} KZ</div><div class="center footer"><p>Obrigado pela preferência!</p><p>Forma Pgto: {venda.forma_pagamento}</p></div>
    </body></html>"""
    return HTMLResponse(content=html_content)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def estornar_venda(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id),
    current_user: Usuario = Depends(get_current_user)
):
    itens_estornados = await estornar_venda_service(db=db, venda_id=id, loja_id=loja_id)

    valor_estornado = Decimal('0')
    total_itens_estornados = 0

    if itens_estornados:
        for item in itens_estornados:
            produto_id = item.get("produto_id")
            nome = item.get("nome")
            novo_estoque = item.get("novo_estoque")
            valor_estornado += Decimal(str(item.get("subtotal", 0)))
            total_itens_estornados += item.get("quantidade", 0)

            try: await manager.broadcast_to_loja(str(loja_id),{"tipo": "stock.updated","produto_id": str(produto_id),"nome_produto": nome,"novo_estoque": novo_estoque})
            except Exception as e: logger.warning(f"WS Broadcast falhou: {e}")

    try: await manager.broadcast_to_loja(str(loja_id), {"tipo": "stats.updated", "valor_venda": -float(valor_estornado), "total_itens": -total_itens_estornados, "acao": "remove"})
    except Exception as e: logger.warning(f"WS Broadcast falhou: {e}")

    # 4. LANÇA ESTORNO NO CAIXA
    if valor_estornado > 0:
        try:
            hoje = date.today()
            stmt_caixa = select(Caixa).where(and_(Caixa.loja_id == loja_id, Caixa.status == StatusCaixa.ABERTO, func.date(Caixa.data_caixa) == hoje))
            result_caixa = await db.execute(stmt_caixa)
            caixa_aberto = result_caixa.scalar_one_or_none()

            logger.info(f"[ESTORNO] Caixa encontrado: {caixa_aberto.id if caixa_aberto else 'NENHUM'}")

            if not caixa_aberto:
                logger.warning(f"AVISO CAIXA: Nenhum caixa aberto HOJE para estorno {id}")
                raise HTTPException(status_code=400, detail="Nenhum caixa aberto para registrar o estorno")

            await registrar_movimento_caixa(db=db, caixa_id=UUID(str(caixa_aberto.id)), loja_id=loja_id, tipo=TipoMovimentacao.SAIDA, valor=valor_estornado, descricao=f"Estorno Venda #{str(id)[:8]}", usuario_id=current_user.id, referencia_id=id, referencia_tipo='estorno', forma_pagamento=None)
            await db.commit()
            try: await manager.broadcast_to_loja(str(loja_id), {"tipo": "caixa.updated"})
            except Exception as e: logger.warning(f"WS Broadcast falhou: {e}")
        except HTTPException as e:
            await db.rollback()
            logger.error(f"AVISO CAIXA ESTORNO: {e.detail}")
        except Exception as e:
            await db.rollback()
            logger.error(f"ERRO AO LANÇAR ESTORNO NO CAIXA: {e}", exc_info=True)

    return None
