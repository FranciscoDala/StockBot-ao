from fastapi import APIRouter, Depends, status, Query, BackgroundTasks, HTTPException
from fastapi.responses import HTMLResponse # <- ADICIONADO
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload # <- ADICIONADO selectinload
from sqlalchemy import select, func # <- ADICIONADO func
from datetime import date
from typing import List
from uuid import UUID
import asyncio

from app.core.deps import get_current_user, require_role, get_current_loja_id
from app.schemas.usuario import Role
from app.models.usuario import Usuario
from app.models.venda import Venda
from app.models.itens_venda import ItemVenda
from app.models.produto import Produto
from app.models.loja import Loja # <- ADICIONADO
from app.models.caixa import Caixa, StatusCaixa # <- NOVO
from app.models.movimentacao_caixa import MovimentacaoCaixa, TipoMovimentacao # <- NOVO
from app.db.session import get_db
from app.schemas.venda import VendaCreate, VendaRead
from app.services.venda import criar_venda, estornar_venda_service
from app.services.whatsapp import enviar_msg_venda
from app.websocket.manager import manager

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
        # 1. ATUALIZA ESTOQUE
        for item in venda.itens:
            if isinstance(item, dict):
                produto_id = item.get("produto_id")
                nome_produto = item.get("nome_produto")
                novo_estoque = item.get("estoque_atual")
            else:
                produto_id = item.produto_id
                nome_produto = item.nome_produto
                novo_estoque = item.estoque_atual

            await manager.broadcast_to_loja(
                str(loja_id),
                {"tipo": "stock.updated", "produto_id": str(produto_id), "nome_produto": nome_produto, "novo_estoque": novo_estoque}
            )

        # 2. ATUALIZA ESTATISTICAS EM TEMPO REAL - NOVO
        await manager.broadcast_to_loja(
            str(loja_id),
            {
                "tipo": "stats.updated",
                "valor_venda": float(venda.total),
                "total_itens": venda.total_itens,
                "acao": "add"
            }
        )

        # 3. LANÇA NO CAIXA SE FOR DINHEIRO - NOVO
        if venda.forma_pagamento and venda.forma_pagamento.lower() == 'dinheiro':
            hoje = date.today()
            caixa_stmt = select(Caixa).where(
                Caixa.loja_id == loja_id,
                Caixa.status == StatusCaixa.ABERTO,
                func.date(Caixa.data) == hoje
            )
            caixa_res = await db.execute(caixa_stmt)
            caixa = caixa_res.scalar_one_or_none()

            if caixa:
                mov = MovimentacaoCaixa(
                    caixa_id=caixa.id,
                    loja_id=loja_id,
                    usuario_id=current_user.id,
                    tipo=TipoMovimentacao.VENDA_DINHEIRO,
                    valor=venda.total,
                    descricao=f"Venda #{str(venda.id)[:8]}",
                    venda_id=venda.id
                )
                db.add(mov)
                await db.commit()
                await manager.broadcast_to_loja(str(loja_id), {"tipo": "caixa.updated"})

    if venda:
        background_tasks.add_task(enviar_msg_venda, db, loja_id, venda)
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

    return vendas_response

@router.get("/{venda_id}/imprimir", response_class=HTMLResponse) # <- TIREI O DEPENDS
async def imprimir_venda(
    venda_id: UUID,
    db: AsyncSession = Depends(get_db),
    loja_id: UUID = Depends(get_current_loja_id) # <- mantém isso pra segurança
):
    # Busca a venda com itens e loja
    stmt = select(Venda).options(
        selectinload(Venda.itens).selectinload(ItemVenda.produto),
        selectinload(Venda.loja),
        selectinload(Venda.usuario) # <- adiciona isso pra não dar erro no venda.usuario.nome
    ).where(Venda.id == venda_id, Venda.loja_id == loja_id)

    result = await db.execute(stmt)
    venda = result.scalar_one_or_none()

    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")

    # Monta HTML da factura
    itens_html = ""
    for item in venda.itens:
        nome = item.produto.nome if item.produto else "Produto Removido"
        itens_html += f"""
        <tr>
            <td>{nome}</td>
            <td style="text-align:center">{item.quantidade}</td>
            <td style="text-align:right">{item.preco_unitario:.2f} KZ</td>
            <td style="text-align:right">{item.subtotal:.2f} KZ</td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html lang="pt-AO">
    <head>
        <meta charset="UTF-8">
        <title>Factura #{str(venda.id)[:8]}</title>
        <style>
            body {{ font-family: 'Arial', sans-serif; padding: 20px; max-width: 80mm; margin: auto; font-size: 12px; }}
          .header {{ text-align: center; margin-bottom: 15px; }}
          .header h1 {{ margin: 0; font-size: 18px; }}
          .info p {{ margin: 2px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
            th, td {{ padding: 4px 0; border-bottom: 1px dashed #ccc; }}
          .total {{ text-align: right; font-size: 16px; font-weight: bold; margin-top: 10px; }}
          .footer {{ text-align: center; margin-top: 20px; font-size: 10px; }}
            @media print {{ body {{ margin: 0; }} }}
        </style>
    </head>
    <body onload="window.print()">
        <div class="header">
            <h1>{venda.loja.nome if venda.loja else 'MINHA LOJA'}</h1>
            <p>FACTURA RECIBO</p>
        </div>
        <div class="info">
            <p><b>Nº:</b> {str(venda.id)[:8]}</p>
            <p><b>Data:</b> {venda.created_at.strftime('%d/%m/%Y %H:%M')}</p>
            <p><b>Vendedor:</b> {venda.usuario.nome if venda.usuario else 'Sistema'}</p>
            <p><b>Pagamento:</b> {venda.forma_pagamento}</p>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Produto</th><th>Qtd</th><th>Preço</th><th>Total</th>
                </tr>
            </thead>
            <tbody>
                {itens_html}
            </tbody>
        </table>
        <div class="total">TOTAL: {venda.total:.2f} KZ</div>
        <div class="footer">
            <p>Obrigado pela preferência!</p>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role(Role.DONO, Role.GERENTE))])
async def estornar_venda(id: UUID, db: AsyncSession = Depends(get_db), loja_id: UUID = Depends(get_current_loja_id)):
    itens_estornados = await estornar_venda_service(db=db, venda_id=id, loja_id=loja_id)

    valor_estornado = 0
    total_itens_estornados = 0

    if itens_estornados:
        for item in itens_estornados:
            if isinstance(item, dict):
                produto_id = item.get("produto_id")
                nome = item.get("nome")
                novo_estoque = item.get("novo_estoque")
                valor_estornado += float(item.get("subtotal", 0))
                total_itens_estornados += item.get("quantidade", 0)
            else:
                produto_id = item.produto_id
                nome = item.nome
                novo_estoque = item.novo_estoque
                valor_estornado += float(item.subtotal)
                total_itens_estornados += item.quantidade

            await manager.broadcast_to_loja(str(loja_id),{"tipo": "stock.updated","produto_id": str(produto_id),"nome_produto": nome,"novo_estoque": novo_estoque})

    # ATUALIZA ESTATISTICAS DO ESTORNO
    await manager.broadcast_to_loja(
        str(loja_id),
        {
            "tipo": "stats.updated",
            "valor_venda": -valor_estornado,
            "total_itens": -total_itens_estornados,
            "acao": "remove"
        }
    )
    return None
