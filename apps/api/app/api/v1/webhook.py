from fastapi import APIRouter, Request, UploadFile, File
from app.core.config import settings
from app.cloudinaryUploads import upload_image_to_cloudinary
from app.services.telegram_service import handle_telegram_photo
import requests
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def send_telegram_message(chat_id: int, text: str):
    """Envia mensagem de volta pro usuário - só roda se tiver token"""
    if not settings.TELEGRAM_BOT_TOKEN:
        return
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    try:
        requests.post(url, json=payload)
    except Exception as e:
        logger.error(f"Erro ao enviar msg: {e}")

@router.post("/")
async def webhook_telegram(request: Request):
    """Recebe updates do Telegram e processa fotos"""
    data = await request.json()
    logger.info(f"Webhook recebido: {data}")

    if 'message' not in data:
        return {"ok": True}

    message = data['message']
    chat_id = message['chat']['id']

    # 1. Se enviou FOTO
    if 'photo' in message:
        file_id = message['photo'][-1]['file_id'] # pega a maior resolução
        try:
            link = await handle_telegram_photo(file_id, settings.TELEGRAM_BOT_TOKEN)
            send_telegram_message(chat_id, f"✅ Foto enviada pro Cloudinary!\n\n{link}")
        except Exception as e:
            logger.error(f"Erro no upload: {e}")
            send_telegram_message(chat_id, "❌ Deu erro ao processar a imagem")

    # 2. Se enviou TEXTO
    elif 'text' in message:
        texto = message['text']
        if texto == '/start':
            send_telegram_message(chat_id, "Olá! Me manda uma foto de produto que eu subo pro Cloudinary pra você.")
        else:
            send_telegram_message(chat_id, f"Recebi: {texto}")

    return {"ok": True}

@router.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    """
    Rota pra testar SEM Telegram.
    POST /api/v1/webhook/test-upload
    Body: form-data > key=file
    """
    try:
        result = upload_image_to_cloudinary(file) # não precisa await pq não é async
        return {
            "msg": "✅ Upload OK",
            "original_url": result["original_url"],
            "optimized_url": result["optimized_url"],
            "public_id": result["public_id"]
        }
    except Exception as e:
        logger.error(f"Erro no test-upload: {e}")
        return {"msg": "❌ Erro no upload", "error": str(e)}
