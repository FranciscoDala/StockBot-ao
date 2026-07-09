from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio
from datetime import date
from app.db.session import AsyncSessionLocal
from app.services.relatorio import gerar_relatorio_diario
from app.services.whatsapp import enviar_relatorio_whatsapp
from sqlalchemy import select
from app.models.loja import Loja
from app.models.usuario_loja import UsuarioLoja
from app.models.usuario import Usuario

async def job_enviar_relatorios():
    print("Iniciando job de relatorios 22:00")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Loja))
        lojas = result.scalars().all()

        for loja in lojas:
            # Busca o dono na usuario_lojas
            stmt = select(Usuario.telefone).join(UsuarioLoja).where(
                UsuarioLoja.loja_id == loja.id,
                UsuarioLoja.role == 'DONO'
            )
            telefone = (await db.execute(stmt)).scalar()

            if telefone:
                relatorio = await gerar_relatorio_diario(db, loja.id, date.today())
                await enviar_relatorio_whatsapp(telefone, relatorio)
                print(f"Enviado para {loja.nome} - {telefone}")

scheduler = AsyncIOScheduler(timezone="Africa/Luanda")
scheduler.add_job(job_enviar_relatorios, CronTrigger(hour=22, minute=0))

async def main():
    scheduler.start()
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
