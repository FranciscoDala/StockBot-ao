import requests
import asyncio
from app.cloudinaryUploads import upload_telegram_photo

async def handle_telegram_photo(file_id: str, bot_token: str):
    """Pega file_id do Telegram, baixa, e sobe pro Cloudinary"""

    # 1. Pega a URL real do arquivo no Telegram
    file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"

    # usa asyncio.to_thread pq requests é bloqueante
    file_info = await asyncio.to_thread(requests.get, file_info_url)
    file_info = file_info.json()

    if not file_info.get('ok'):
        raise Exception(f"Erro ao buscar arquivo do Telegram: {file_info}")

    file_path = file_info['result']['file_path']
    file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"

    # 2. Sobe pro Cloudinary
    resultado = await asyncio.to_thread(upload_telegram_photo, file_url)

    return resultado['optimized_url']
