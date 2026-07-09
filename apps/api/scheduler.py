from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio
from datetime import date
from app.db.session import AsyncSessionLocal
from app.services.relatorio import gerar_relatorio_diario
from app.services.whatsapp import enviar_msg_venda # <- CORRIGIDO AQUI
from sqlalchemy import select
from app.models.loja import Loja

async def job_enviar_relatorios():
    print("Iniciando job de relatorios 22:00")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Loja))
        lojas = result.scalars().all()

        for loja in lojas:
            relatorio = await gerar_relatorio_diario(db, loja.id, date.today())

            # CORRIGIDO: cria um objeto fake de venda só pra mandar o texto
            class VendaFake:
                def __init__(self, id, total, created_at, itens, cliente_nome):
                    self.id = id
                    self.total = total
                    self.created_at = created_at
                    self.itens = itens
                    self.cliente_nome = cliente_nome

            venda_fake = VendaFake(
                id="RELATORIO",
                total=0,
                created_at=asyncio.get_event_loop().time(),
                itens=[],
                cliente_nome="Relatorio Diario"
            )
            # Reaproveita a mesma função de enviar
            await enviar_msg_venda(db, loja.id, venda_fake, mensagem_custom=relatorio)
            print(f"Enviado para: {loja.nome}")

scheduler = AsyncIOScheduler(timezone="Africa/Luanda")
scheduler.add_job(job_enviar_relatorios, CronTrigger(hour=22, minute=0))

async def main():
    scheduler.start()
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
