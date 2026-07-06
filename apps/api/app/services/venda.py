from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status
from decimal import Decimal
from datetime import date
from uuid import UUID

from api.app.models.venda import Venda
from api.app.models.itens_venda import ItemVenda
from api.app.models.produto import Produto
from api.app.models.usuario import Usuario
from api.app.models.usuario_loja import UsuarioLoja # <- CORRIGIDO
from api.app.models.role import UserRole # <- CORRIGIDO
from api.app.schemas.venda import VendaCreate, VendaRead, ItemVendaRead

async def criar_venda(db: AsyncSession, venda_in: VendaCreate, usuario: Usuario, loja_id: UUID) -> VendaRead:
    async with db.begin():
        total_venda = Decimal(0)
        itens_para_criar = []

        for item_in in venda_in.itens:
            result = await db.execute(select(Produto).where(Produto.id == item_in.produto_id, Produto.loja_id == loja_id).with_for_update())
            produto = result.scalar_one_or_none()
            if not produto:
                raise HTTPException(status_code=404, detail=f"Produto id={item_in.produto_id} não encontrado nesta loja")
            if produto.estoque < item_in.quantidade:
                raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {produto.nome}. Disponível: {produto.estoque}")

            produto.estoque -= item_in.quantidade
            db.add(produto)
            subtotal = produto.preco * item_in.quantidade
            total_venda += subtotal
            itens_para_criar.append(ItemVenda(
                produto_id=produto.id,
                loja_id=loja_id,
                quantidade=item_in.quantidade,
                preco_unitario=produto.preco,
                subtotal=subtotal
            ))

        nova_venda = Venda(loja_id=loja_id, usuario_id=usuario.id, total=total_venda, itens=itens_para_criar)
        db.add(nova_venda)
        await db.flush()
        result = await db.execute(select(Venda).where(Venda.id == nova_venda.id).options(selectinload(Venda.itens).selectinload(ItemVenda.produto), selectinload(Venda.usuario)))
        venda_db = result.scalar_one()

    return VendaRead(id=venda_db.id, loja_id=venda_db.loja_id, usuario_id=venda_db.usuario_id, nome_vendedor=venda_db.usuario.nome, total=venda_db.total, data_venda=venda_db.data_venda, status=venda_db.status, itens=[ItemVendaRead(id=i.id, produto_id=i.produto_id, nome_produto=i.produto.nome, quantidade=i.quantidade, preco_unitario=i.preco_unitario, subtotal=i.subtotal) for i in venda_db.itens])

async def listar_vendas(db: AsyncSession, usuario: Usuario, loja_id: UUID, data_inicio: date | None = None, data_fim: date | None = None, vendedor_id: UUID | None = None) -> list[VendaRead]:
    query = select(Venda).options(selectinload(Venda.itens).selectinload(ItemVenda.produto), selectinload(Venda.usuario))
    filtros = [Venda.status == "concluida", Venda.loja_id == loja_id]

    if data_inicio: filtros.append(func.date(Venda.data_venda) >= data_inicio)
    if data_fim: filtros.append(func.date(Venda.data_venda) <= data_fim)

    # Vendedor só vê as próprias vendas da loja
    vinculo_vendedor = any(v.role == UserRole.VENDEDOR and v.loja_id == loja_id for v in usuario.vinculos) # <- CORRIGIDO
    if vinculo_vendedor:
        filtros.append(Venda.usuario_id == usuario.id)
    elif vendedor_id: # Dono/Gerente pode filtrar por vendedor
        filtros.append(Venda.usuario_id == vendedor_id)

    query = query.where(and_(*filtros)).order_by(Venda.data_venda.desc())
    result = await db.execute(query)
    vendas_db = result.scalars().all()
    return [VendaRead(id=v.id, loja_id=v.loja_id, usuario_id=v.usuario_id, nome_vendedor=v.usuario.nome, total=v.total, data_venda=v.data_venda, status=v.status, itens=[ItemVendaRead(id=i.id, produto_id=i.produto_id, nome_produto=i.produto.nome, quantidade=i.quantidade, preco_unitario=i.preco_unitario, subtotal=i.subtotal) for i in v.itens]) for v in vendas_db]

async def estornar_venda_service(db: AsyncSession, venda_id: UUID, loja_id: UUID):
    async with db.begin():
        result = await db.execute(select(Venda).where(Venda.id == venda_id, Venda.loja_id == loja_id, Venda.status == "concluida").options(selectinload(Venda.itens)).with_for_update())
        venda = result.scalar_one_or_none()
        if not venda: raise HTTPException(status_code=404, detail="Venda não encontrada nesta loja ou já estornada")
        for item in venda.itens:
            result_prod = await db.execute(select(Produto).where(Produto.id == item.produto_id, Produto.loja_id == loja_id).with_for_update())
            produto = result_prod.scalar_one()
            produto.estoque += item.quantidade
            db.add(produto)
        venda.status = "estornada"
        db.add(venda)
    return {"msg": f"Venda {venda_id} estornada. Estoque devolvido."}
