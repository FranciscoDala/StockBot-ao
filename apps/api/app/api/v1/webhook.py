from fastapi import APIRouter
router = APIRouter()

@router.post("/")
async def webhook_whatsapp():
    return {"msg": "Webhook - em construção"} # Placeholder por agora