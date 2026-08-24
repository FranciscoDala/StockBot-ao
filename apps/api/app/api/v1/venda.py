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
async def criar_venda_endpoint(venda_in: VendaCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: Usuario = Depends(get_current_user), loja_id: UUID = Depends(get_current_loja_id)):
    venda = await criar_venda(db=db, venda_in=venda_in, usuario=current_user, loja_id=loja_id)

    if venda and venda.itens:
        venda.tipo_documento = "RECIBO"
        venda.serie = "REC"
        venda.numero_fatura = None
        venda.valor_iva = Decimal(0)
        venda.subtotal = venda.total
        await db.commit()
        await db.refresh(venda) # <- ADICIONA ISSO AQUI

        for item in venda.itens:
            produto_id = item.produto_id
            nome_produto = item.nome_produto
            produto_db = await db.get(Produto, produto_id)
            if produto_db and produto_db.controla_estoque:
                await db.refresh(produto_db)
                try: await manager.broadcast_to_loja(str(loja_id), {"tipo": "stock.updated", "produto_id": str(produto_id), "nome_produto": nome_produto, "novo_estoque": produto_db.estoque})
                except Exception as e: logger.warning(f"WS Broadcast falhou: {e}")

        try: await manager.broadcast_to_loja(str(loja_id), {"tipo": "stats.updated", "valor_venda": float(venda.total), "total_itens": venda.total_itens, "acao": "add"})
        except Exception as e: logger.warning(f"WS Broadcast falhou: {e}")

        try:
            hoje = date.today()
            stmt_caixa = select(Caixa).where(and_(Caixa.loja_id == loja_id, Caixa.status == StatusCaixa.ABERTO, func.date(Caixa.data_caixa) == hoje))
            result_caixa = await db.execute(stmt_caixa)
            caixa_aberto = result_caixa.scalar_one_or_none()
            logger.info(f"[VENDA] Caixa encontrado: {caixa_aberto.id if caixa_aberto else 'NENHUM'}")
            if caixa_aberto:
                await registrar_movimento_caixa(db=db, caixa_id=UUID(str(caixa_aberto.id)), loja_id=loja_id, tipo=TipoMovimentacao.ENTRADA, valor=Decimal(str(venda.total)), descricao=f"Venda #{str(venda.id)[:8]} - {venda.forma_pagamento}", usuario_id=current_user.id, referencia_id=venda.id, referencia_tipo='venda', forma_pagamento=venda.forma_pagamento)
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
     .options(joinedload(Venda.usuario), joinedload(Venda.cliente), joinedload(Venda.itens).joinedload(ItemVenda.produto))
     .where(Venda.loja_id == loja_id_usar)
     .order_by(Venda.created_at.desc())
     .limit(limit)
     .offset(offset)
    )

    if data_inicio: query = query.where(Venda.created_at >= data_inicio)
    if data_fim: query = query.where(Venda.created_at <= data_fim)
    if vendedor_id: query = query.where(Venda.usuario_id == vendedor_id)

    result = await db.execute(query)
    vendas_db = result.scalars().unique().all()

    # MONTA NA MÃO PRA GARANTIR
    response = []
    for v in vendas_db:
        data = VendaRead.model_validate(v).model_dump()
        data["data_venda"] = v.created_at
        data["nome_vendedor"] = v.usuario.nome if v.usuario else "Sistema"
        data["nome_cliente"] = v.cliente.nome if v.cliente else None
        data["cliente_nif"] = v.cliente.nif if v.cliente else None
        response.append(VendaRead.model_validate(data))

    return response



@router.get("/{venda_id}/imprimir", response_class=HTMLResponse)
async def imprimir_venda(venda_id: UUID, db: AsyncSession = Depends(get_db), loja_id: UUID = Depends(get_current_loja_id)):
    stmt = select(Venda).options(selectinload(Venda.itens).selectinload(ItemVenda.produto), selectinload(Venda.loja), selectinload(Venda.usuario), selectinload(Venda.cliente)).where(Venda.id == venda_id, Venda.loja_id == loja_id)
    result = await db.execute(stmt)
    venda = result.scalar_one_or_none()
    if not venda: raise HTTPException(status_code=404, detail="Venda não encontrada")

    eh_factura = venda.tipo_documento == "FACTURA"
    titulo = "FACTURA" if eh_factura else "RECIBO DE VENDA"
    numero = venda.numero_fatura if eh_factura else str(venda.id)[:8]

    itens_html = ""
    for item in venda.itens:
        nome = item.produto.nome if item.produto else "Produto Removido"
        if eh_factura:
            itens_html += f"""<tr><td>{nome}</td><td style="text-align:center">{item.quantidade}</td><td style="text-align:right">{item.preco_unitario:.2f} KZ</td><td style="text-align:right">{item.subtotal:.2f} KZ</td></tr>"""
        else:
            itens_html += f"""<tr><td>{nome}</td><td style="text-align:center">{item.quantidade}</td><td style="text-align:right">{item.subtotal:.2f} KZ</td></tr>"""

    cliente_html = ""
    if eh_factura:
        cliente_html = f"""<p><b>Cliente:</b> {venda.cliente.nome if venda.cliente else 'Consumidor Final'}</p><p><b>NIF:</b> {venda.cliente.nif if venda.cliente else '-'}</p>"""
        totais_html = f"""<div style="text-align:right"><p>Subtotal: {venda.subtotal:.2f} KZ</p><p>IVA 14%: {venda.valor_iva:.2f} KZ</p></div>"""
        tabela_head = "<tr><th>Item</th><th>Qtd</th><th>P.Unit</th><th>Total</th></tr>"
    else:
        totais_html = ""
        tabela_head = "<tr><th>Item</th><th>Qtd</th><th>Total</th></tr>"

    html_content = f"""<!DOCTYPE html><html lang="pt-AO"><head><meta charset="UTF-8"><title>{titulo} #{numero}</title>
    <style>body{{font-family:Arial,sans-serif;padding:5px;width:80mm;margin:0 auto;font-size:11px}}.center{{text-align:center}}.header h2{{margin:0;font-size:16px}}table{{width:100%;border-collapse:collapse;margin-top:8px}}th,td{{padding:2px 0;border-bottom:1px dashed #ccc}}th{{border-bottom:1px solid #000}}.total{{font-weight:bold;font-size:14px;text-align:right;border-top:1px dashed #000;padding-top:5px;margin-top:5px}}.footer{{text-align:center;margin-top:10px;font-size:10px}}@media print{{body{{margin:0}}}}</style>
    </head><body onload="window.print()">
        <div class="center header">
            <h2>{venda.loja.nome if venda.loja else 'MINHA LOJA'}</h2>
            {f'<p>NIF: {venda.loja.nif}</p>' if venda.loja and venda.loja.nif else ''}
            <p>{titulo}</p>
            <p>Nº: {numero} | {venda.created_at.strftime('%d/%m/%Y %H:%M')}</p>
            <p>Vendedor: {venda.usuario.nome if venda.usuario else 'Sistema'}</p>
            {cliente_html}
        </div>
        <table><thead>{tabela_head}</thead><tbody>{itens_html}</tbody></table>
        {totais_html}
        <div class="total">TOTAL: {venda.total:.2f} KZ</div>
        <div class="center footer">
            <p>Obrigado pela preferência!</p>
            <p>Forma Pgto: {venda.forma_pagamento}</p>
            {f'<p>IVA incluído à taxa legal de 14%</p>' if eh_factura else ''}
        </div>
    </body></html>"""
    return HTMLResponse(content=html_content)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def estornar_venda(id: UUID, db: AsyncSession = Depends(get_db), loja_id: UUID = Depends(get_current_loja_id), current_user: Usuario = Depends(get_current_user)):
    itens_estornados = await estornar_venda_service(db=db, venda_id=id, loja_id=loja_id)
    valor_estornado = Decimal('0'); total_itens_estornados = 0
    if itens_estornados:
        for item in itens_estornados:
            produto_id = item.get("produto_id"); nome = item.get("nome"); novo_estoque = item.get("novo_estoque")
            valor_estornado += Decimal(str(item.get("subtotal", 0))); total_itens_estornados += item.get("quantidade", 0)
            try: await manager.broadcast_to_loja(str(loja_id),{"tipo": "stock.updated","produto_id": str(produto_id),"nome_produto": nome,"novo_estoque": novo_estoque})
            except Exception as e: logger.warning(f"WS Broadcast falhou: {e}")
    try: await manager.broadcast_to_loja(str(loja_id), {"tipo": "stats.updated", "valor_venda": -float(valor_estornado), "total_itens": -total_itens_estornados, "acao": "remove"})
    except Exception as e: logger.warning(f"WS Broadcast falhou: {e}")
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
            await db.rollback(); logger.error(f"AVISO CAIXA ESTORNO: {e.detail}")
        except Exception as e:
            await db.rollback(); logger.error(f"ERRO AO LANÇAR ESTORNO NO CAIXA: {e}", exc_info=True)
    return None

async def gerar_numero_fatura(db: AsyncSession, loja_id: UUID, serie: str = "FT") -> str:
    ano_atual = date.today().year
    stmt = select(func.count(Venda.id)).where(and_(Venda.loja_id == loja_id, Venda.tipo_documento == "FACTURA", Venda.serie == serie, func.extract('year', Venda.created_at) == ano_atual))
    result = await db.execute(stmt)
    sequencia = result.scalar_one() + 1
    return f"{serie} 001/{ano_atual}/{sequencia:06d}"

@router.post("/{venda_id}/faturar", response_model=VendaRead, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def faturar_venda(venda_id: UUID, payload: dict, db: AsyncSession = Depends(get_db), loja_id: UUID = Depends(get_current_loja_id), current_user: Usuario = Depends(get_current_user)):
    from app.models.cliente import Cliente
    venda = await db.get(Venda, venda_id)
    if not venda or venda.loja_id!= loja_id: raise HTTPException(404, "Venda não encontrada")
    if venda.tipo_documento == "FACTURA": raise HTTPException(400, "Venda já é uma factura")
    if venda.status == "anulada": raise HTTPException(400, "Não é possível faturar uma venda anulada")
    nif = payload.get("nif"); nome_cliente = payload.get("nome_cliente", "Cliente AGT")
    if not nif: raise HTTPException(400, "NIF é obrigatório para faturar")
    venda.subtotal = Decimal(str(venda.total)); venda.valor_iva = Decimal(str(venda.total)) * Decimal('0.14'); venda.total = venda.subtotal + venda.valor_iva
    venda.tipo_documento = "FACTURA"; venda.serie = "FT"; venda.numero_fatura = await gerar_numero_fatura(db, loja_id, "FT")
    stmt = select(Cliente).where(Cliente.loja_id == loja_id, Cliente.nif == nif)
    result = await db.execute(stmt); cliente = result.scalar_one_or_none()
    if not cliente: cliente = Cliente(loja_id=loja_id, nome=nome_cliente, nif=nif); db.add(cliente); await db.flush()
    venda.cliente_id = cliente.id
    await db.commit(); await db.refresh(venda)
    return venda
