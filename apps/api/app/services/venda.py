from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import date
from fastapi import HTTPException
from decimal import Decimal

from api.app.models.venda import Venda
from api.app.models.itens_venda import ItemVenda
from api.app.models.produto import Produto
from api.app.schemas.venda import VendaCreate, VendaRead, ItemVendaRead
from api.app.models.usuario import Usuario

async def criar_venda(db: AsyncSession, venda_in: VendaCreate, usuario: Usuario, loja_id: UUID):
    try:
        # 1. Criar a venda
        nova_venda = Venda(
            loja_id=loja_id,
            usuario_id=usuario.id,
            total=venda_in.total,
            total_itens=venda_in.total_itens,
            forma_pagamento=venda_in.forma_pagamento,
            valor_recebido=venda_in.valor_recebido,
            troco=venda_in.troco,
            status='concluida'
        )
        db.add(nova_venda)
        await db.flush() # pra pegar o id

        # 2. Criar os itens e baixar estoque
        for item_in in venda_in.itens:
            # Baixar estoque
            stmt_prod = select(Produto).where(Produto.id == item_in.produto_id, Produto.loja_id == loja_id)
            produto = (await db.execute(stmt_prod)).scalar_one_or_none()
            if not produto:
                raise HTTPException(status_code=404, detail=f"Produto {item_in.produto_id} não encontrado")
            if produto.estoque < item_in.quantidade:
                raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {produto.nome}")

            produto.estoque -= item_in.quantidade
            db.add(produto)

            # Criar item da venda
            novo_item = ItemVenda(
                venda_id=nova_venda.id,
                produto_id=item_in.produto_id,
                loja_id=loja_id,
                quantidade=item_in.quantidade,
                preco_unitario=item_in.preco_unitario,
                subtotal=item_in.subtotal
            )
            db.add(novo_item)

        await db.commit() # <- COMMIT AQUI
        await db.refresh(nova_venda)
        return await listar_venda_por_id(db, nova_venda.id, loja_id)

    except Exception:
        await db.rollback() # <- ROLLBACK SE DER ERRO
        raise

async def listar_venda_por_id(db: AsyncSession, venda_id: UUID, loja_id: UUID):
    stmt = select(Venda).options(
        selectinload(Venda.itens).selectinload(ItemVenda.produto),
        selectinload(Venda.usuario)
    ).where(Venda.id == venda_id, Venda.loja_id == loja_id)
    venda = (await db.execute(stmt)).scalar_one_or_none()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")

    return VendaRead.model_validate({
        **venda.__dict__,
        "nome_vendedor": venda.usuario.nome if venda.usuario else "Sistema",
        "data_venda": venda.created_at,
        "itens": [
            ItemVendaRead.model_validate({
                **item.__dict__,
                "nome_produto": item.produto.nome
            }) for item in venda.itens
        ]
    })

async def listar_vendas(db: AsyncSession, current_user: Usuario, loja_id: UUID, data_inicio: date | None, data_fim: date | None, vendedor_id: UUID | None):
    pass

async def estornar_venda_service(db: AsyncSession, venda_id: UUID, loja_id: UUID):
    pass
