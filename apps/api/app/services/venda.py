from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import date

from app.models.venda import Venda, ItemVenda
from app.models.produto import Produto
from app.models.usuario import Usuario, NivelAcesso
from app.schemas.venda import VendaCreate, VendaRead, ItemVendaRead

async def criar_venda(db: AsyncSession, venda_in: VendaCreate, usuario: Usuario) -> VendaRead:
    async with db.begin():
        total_venda = Decimal(0)
        itens_para_criar = []

        for item_in in venda_in.itens:
            result = await db.execute(select(Produto).where(Produto.id == item_in.produto_id).with_for_update())
            produto = result.scalar_one_or_none()

            if not produto:
                raise HTTPException(status_code=404, detail=f"Produto id={item_in.produto_id} não encontrado")

            if produto.stock < item_in.quantidade:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Stock insuficiente para {produto.nome}. Disponível: {produto.stock}")

            produto.stock -= item_in.quantidade
            db.add(produto)

            subtotal = produto.preco * item_in.quantidade
            total_venda += subtotal

            itens_para_criar.append(ItemVenda(produto_id=produto.id, quantidade=item_in.quantidade, preco_unitario=produto.preco, subtotal=subtotal))

        nova_venda = Venda(usuario_id=usuario.id, total=total_venda, itens=itens_para_criar)
        db.add(nova_venda)
        await db.flush()

        result = await db.execute(select(Venda).where(Venda.id == nova_venda.id).options(selectinload(Venda.itens).selectinload(ItemVenda.produto), selectinload(Venda.usuario)))
        venda_db = result.scalar_one()

    return VendaRead(
        id=venda_db.id, usuario_id=venda_db.usuario_id, nome_vendedor=venda_db.usuario.nome,
        total=venda_db.total, created_at=venda_db.created_at, status=venda_db.status, # <- ADD STATUS
        itens=[ItemVendaRead(id=i.id, produto_id=i.produto_id, nome_produto=i.produto.nome, quantidade=i.quantidade, preco_unitario=i.preco_unitario, subtotal=i.subtotal) for i in venda_db.itens]
    )

async def listar_vendas(db: AsyncSession, usuario: Usuario, data_inicio: date | None = None, data_fim: date | None = None, vendedor_id: int | None = None) -> list[VendaRead]:
    query = select(Venda).options(selectinload(Venda.itens).selectinload(ItemVenda.produto), selectinload(Venda.usuario))

    filtros = [Venda.status == "concluida"] # <- Só venda válida
    if data_inicio: filtros.append(func.date(Venda.created_at) >= data_inicio)
    if data_fim: filtros.append(func.date(Venda.created_at) <= data_fim)
    if usuario.nivel == NivelAcesso.VENDEDOR: filtros.append(Venda.usuario_id == usuario.id)
    elif vendedor_id: filtros.append(Venda.usuario_id == vendedor_id)

    query = query.where(and_(*filtros)).order_by(Venda.created_at.desc())
    result = await db.execute(query)
    vendas_db = result.scalars().all()

    return [VendaRead(id=v.id, usuario_id=v.usuario_id, nome_vendedor=v.usuario.nome, total=v.total, created_at=v.created_at, status=v.status, itens=[ItemVendaRead(id=i.id, produto_id=i.produto_id, nome_produto=i.produto.nome, quantidade=i.quantidade, preco_unitario=i.preco_unitario, subtotal=i.subtotal) for i in v.itens]) for v in vendas_db]

async def estornar_venda_service(db: AsyncSession, venda_id: int):
    async with db.begin():
        result = await db.execute(select(Venda).where(Venda.id == venda_id, Venda.status == "concluida").options(selectinload(Venda.itens)).with_for_update())
        venda = result.scalar_one_or_none()
        if not venda: raise HTTPException(status_code=404, detail="Venda não encontrada ou já estornada")

        for item in venda.itens:
            result_prod = await db.execute(select(Produto).where(Produto.id == item.produto_id).with_for_update())
            produto = result_prod.scalar_one()
            produto.stock += item.quantidade
            db.add(produto)

        venda.status = "estornada" # <- SOFT DELETE
        db.add(venda)
    return {"msg": f"Venda {venda_id} estornada. Stock devolvido. Histórico mantido."}