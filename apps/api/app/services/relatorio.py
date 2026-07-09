from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
from app.models.venda import Venda
from app.models.itens_venda import ItemVenda
from app.models.produto import Produto

async def gerar_relatorio_diario(db: AsyncSession, loja_id: int, data: date):
    # Total vendas e faturamento
    stmt = select(func.count(Venda.id), func.sum(Venda.total)).where(
        Venda.loja_id == loja_id,
        func.date(Venda.created_at) == data
    )
    total_vendas, faturamento = (await db.execute(stmt)).one()

    # Top 5 produtos
    stmt_top = select(
        Produto.nome,
        func.sum(ItemVenda.quantidade).label('qtd')
    ).join(ItemVenda.produto).join(ItemVenda.venda).where(
        Venda.loja_id == loja_id,
        func.date(Venda.created_at) == data
    ).group_by(Produto.nome).order_by(func.sum(ItemVenda.quantidade).desc()).limit(5)

    top_produtos = (await db.execute(stmt_top)).all()

    texto = f"""📊 RELATÓRIO DIÁRIO - StockBot AO
Data: {data.strftime('%d/%m/%Y')}

💰 VENDAS: {total_vendas or 0}
💵 FATURAMENTO: {faturamento or 0:.2f} KZ

TOP 5 MAIS VENDIDOS:
"""
    for i, p in enumerate(top_produtos, 1):
        texto += f"{i}. {p.nome} - {p.qtd} un\n"

    return texto
