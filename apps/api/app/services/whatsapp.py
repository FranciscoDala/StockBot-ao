import httpx
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.usuario import Usuario
from app.models.usuario_loja import UsuarioLoja
from datetime import datetime

EVOLUTION_URL = os.getenv("EVOLUTION_URL")
EVOLUTION_KEY = os.getenv("EVOLUTION_API_KEY")
INSTANCE = os.getenv("EVOLUTION_INSTANCE")

async def get_telefone_dono(db: AsyncSession, loja_id: int):
    stmt = select(Usuario.telefone).join(UsuarioLoja).where(
        UsuarioLoja.loja_id == loja_id,
        UsuarioLoja.role == 'DONO'
    )
    return (await db.execute(stmt)).scalar()

async def enviar_msg_venda(db: AsyncSession, loja_id: int, venda, mensagem_custom: str = None):
    telefone = await get_telefone_dono(db, loja_id)
    if not telefone:
        print("Dono sem telefone")
        return

    numero = telefone.replace("+", "").replace(" ", "") + "@c.us"

    if mensagem_custom:
        mensagem = mensagem_custom
    else:
        # FIX 1: Pega cliente. Pode ser .cliente ou .cliente_nome
        nome_cliente = getattr(venda, 'cliente', None) or getattr(venda, 'cliente_nome', None) or 'Balcão'

        # FIX 2: Pega data. Pode ser .created_at ou .data_venda ou .criado_em
        data_venda = getattr(venda, 'created_at', None) or getattr(venda, 'data_venda', None) or getattr(venda, 'criado_em', None) or datetime.now()
        hora_str = data_venda.strftime('%H:%M') if hasattr(data_venda, 'strftime') else 'agora'

        mensagem = f"""🔔 NOVA VENDA - StockBot AO

🧾 Venda: #{str(venda.id)[:8]}
💰 Total: {venda.total:.2f} KZ
👤 Cliente: {nome_cliente}
📦 Itens: {len(venda.itens)}
⏰ Hora: {hora_str}
"""

    payload = {"number": numero, "textMessage": {"text": mensagem}}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{EVOLUTION_URL}/message/sendText/{INSTANCE}",
                json=payload,
                headers={"apikey": EVOLUTION_KEY}
            )
            print(f"Whats enviado: {r.status_code}")
    except Exception as e:
        print(f"Erro Whats: {e}")
