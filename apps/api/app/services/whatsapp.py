import httpx
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from app.models.venda import Venda
from app.models.itens_venda import ItemVenda
from app.models.produto import Produto
from datetime import datetime

BOT_URL = os.getenv("BOT_URL")

async def get_telefone_dono(db: AsyncSession, loja_id: UUID):
    stmt = select(Usuario.telefone).join(UsuarioLoja).where(
        UsuarioLoja.loja_id == loja_id,
        UsuarioLoja.role == 'DONO'
    )
    telefone = (await db.execute(stmt)).scalar()
    return telefone or ""

async def enviar_msg_venda(db: AsyncSession, loja_id: UUID, venda_id: UUID, mensagem_custom: str | None = None): # <- CORRIGIDO: str | None
    stmt = select(Venda).options(
        selectinload(Venda.itens).selectinload(ItemVenda.produto)
    ).where(Venda.id == venda_id)
    result = await db.execute(stmt)
    venda = result.scalar_one_or_none()

    if not venda:
        print("Venda não encontrada para enviar Whats")
        return

    telefone = await get_telefone_dono(db, loja_id)
    if not telefone:
        print("Dono sem telefone")
        return

    if mensagem_custom:
        mensagem = mensagem_custom
    else:
        nome_cliente = 'Balcão'
        data_venda = venda.created_at
        hora_str = data_venda.strftime('%H:%M')

        mensagem = f"""🔔 NOVA VENDA - StockBot AO

🧾 Venda: #{str(venda.id)[:8]}
💰 Total: {venda.total:.2f} KZ
👤 Cliente: {nome_cliente}
📦 Itens: {len(venda.itens)}
⏰ Hora: {hora_str}
"""

    payload = {"to": telefone, "message": mensagem}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(f"{BOT_URL}/send", json=payload)
            print(f"Whats enviado: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Erro Whats: {e}")
