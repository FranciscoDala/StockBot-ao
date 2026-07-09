from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.websocket.manager import manager

router = APIRouter()

@router.websocket("/ws/lojas/{loja_id}")
async def websocket_endpoint(websocket: WebSocket, loja_id: str):
    token = websocket.query_params.get("token")
    # TODO: valida o token aqui. Se inválido: await websocket.close()

    await manager.connect(websocket, loja_id)
    try:
        while True:
            await websocket.receive_text() # keepalive
    except WebSocketDisconnect:
        manager.disconnect(websocket, loja_id)
