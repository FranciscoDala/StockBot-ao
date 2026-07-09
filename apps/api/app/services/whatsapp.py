import httpx
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja

EVOLUTION_URL = os.getenv("EVOLUTION_URL")
EVOLUTION_KEY = os.getenv("EVOLUTION_API_KEY")
INSTANCE = os.getenv("EVOLUTION_INSTANCE")

async def get_telefone_dono(db: AsyncSession, loja_id: int):
    stmt = select(Usuario.telefone).join(UsuarioLoja).where(
        UsuarioLoja.loja_id == loja_id,
        UsuarioLoja.role == 'DONO'
    )
    return (await db.execute(stmt)).scalar()

async def enviar_msg_venda(db: AsyncSession, loja_id: int, venda):
    telefone = await get_telefone_dono(db, loja_id)
    if not telefone:
        return

    numero = telefone.replace("+", "") + "@c.us"

    mensagem = f"""🔔 NOVA VENDA - StockBot AO

🧾 Venda: #{venda.id}
💰 Total: {venda.total:.2f} KZ
👤 Cliente: {venda.cliente_nome or 'Balcão'}
📦 Itens: {len(venda.itens)}
⏰ Hora: {venda.created_at.strftime('%H:%M')}
"""

    payload = {
        "number": numero,
        "textMessage": {"text": mensagem}
    }

    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(
            f"{EVOLUTION_URL}/message/sendText/{INSTANCE}",
            json=payload,
            headers={"apikey": EVOLUTION_KEY}
        )
