from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import date, datetime
from fastapi import HTTPException
from decimal import Decimal

from app.models.venda import Venda
from app.models.itens_venda import ItemVenda
from app.models.produto import Produto
from app.schemas.venda import VendaCreate, VendaRead, ItemVendaRead
from app.models.usuario import Usuario

async def criar_venda(db: AsyncSession, venda_in: VendaCreate, usuario: Usuario, loja_id: UUID):
    itens_para_broadcast = [] # <- 1. GUARDA OS DADOS PRA DEVOLVER

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
            status='concluida' # <- MINUSCULO
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

            # REGRA 3: SÓ VALIDA E BAIXA SE CONTROLAR ESTOQUE
            if produto.controla_estoque:
                if produto.estoque < item_in.quantidade:
                    raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {produto.nome}")

                produto.estoque -= item_in.quantidade
                db.add(produto)
                novo_estoque = produto.estoque
            else:
                novo_estoque = None # produto de serviço/comida não tem estoque

            # GUARDA PRA MANDAR PRO WS DEPOIS DO COMMIT
            itens_para_broadcast.append({
                "produto_id": produto.id,
                "nome": produto.nome,
                "novo_estoque": novo_estoque
            })

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

        venda_read = await listar_venda_por_id(db, nova_venda.id, loja_id)

        # 2. ANEXA O ESTOQUE ATUALIZADO NA VENDA PRA ROTA USAR
        venda_read.itens = [
            {**item.model_dump(), "estoque_atual": next((i["novo_estoque"] for i in itens_para_broadcast if i["produto_id"] == item.produto_id), None)}
            for item in venda_read.itens
        ]
        return venda_read

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

async def listar_vendas(
    db: AsyncSession,
    current_user: Usuario,
    loja_id: UUID,
    data_inicio: date | None,
    data_fim: date | None,
    vendedor_id: UUID | None,
    limit: int = 5000,
    offset: int = 0 # <- NOVO
):
    stmt = select(Venda).options(
        selectinload(Venda.itens).selectinload(ItemVenda.produto),
        selectinload(Venda.usuario)
    ).where(Venda.loja_id == loja_id)

    if data_inicio:
        # converte date pra datetime inicio do dia
        inicio_dt = datetime.combine(data_inicio, datetime.min.time())
        stmt = stmt.where(Venda.created_at >= inicio_dt)

    if data_fim:
        # converte date pra datetime fim do dia
        fim_dt = datetime.combine(data_fim, datetime.max.time())
        stmt = stmt.where(Venda.created_at <= fim_dt)

    if vendedor_id:
        stmt = stmt.where(Venda.usuario_id == vendedor_id)

    stmt = stmt.order_by(Venda.created_at.desc()).limit(limit).offset(offset) # <- ADICIONADO OFFSET

    result = await db.execute(stmt)
    vendas = result.scalars().all()

    # Converte pra VendaRead
    vendas_read: list[VendaRead] = []
    for venda in vendas:
        vendas_read.append(VendaRead.model_validate({
            **venda.__dict__,
            "nome_vendedor": venda.usuario.nome if venda.usuario else "Sistema",
            "data_venda": venda.created_at,
            "itens": [
                ItemVendaRead.model_validate({
                    **item.__dict__,
                    "nome_produto": item.produto.nome
                }) for item in venda.itens
            ]
        }))

    return vendas_read

async def estornar_venda_service(db: AsyncSession, venda_id: UUID, loja_id: UUID):
    itens_para_broadcast = [] # <- 3. GUARDA OS DADOS PRA DEVOLVER

    stmt_venda = select(Venda).options(selectinload(Venda.itens)).where(Venda.id == venda_id, Venda.loja_id == loja_id)
    venda = (await db.execute(stmt_venda)).scalar_one_or_none()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    if venda.status == 'estornada': # <- MINUSCULO
        raise HTTPException(status_code=400, detail="Venda já estornada")

    # 4. DEVOLVE ESTOQUE APENAS SE CONTROLAR
    for item in venda.itens:
        stmt_prod = select(Produto).where(Produto.id == item.produto_id, Produto.loja_id == loja_id)
        produto = (await db.execute(stmt_prod)).scalar_one_or_none()
        if produto:
            novo_estoque = None
            if produto.controla_estoque: # REGRA 3
                produto.estoque += item.quantidade
                db.add(produto)
                novo_estoque = produto.estoque

            itens_para_broadcast.append({
                "produto_id": produto.id,
                "nome": produto.nome,
                "novo_estoque": novo_estoque
            })

    venda.status = 'estornada' # <- MINUSCULO
    db.add(venda)
    await db.commit()

    return itens_para_broadcast # <- 5. RETORNA PRA ROTA FAZER O BROADCAST
