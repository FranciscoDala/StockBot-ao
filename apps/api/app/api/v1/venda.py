from fastapi import APIRouter
router = APIRouter()

@router.post("/")
async def criar_venda():
    return {"msg": "Venda - em construção"} # Placeholder por agora