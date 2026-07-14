from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from jose import jwt, JWTError
from app.core.config import settings
from app.websocket.manager import manager

router = APIRouter()

@router.websocket("/ws/lojas/{loja_id}")
async def websocket_endpoint(websocket: WebSocket, loja_id: str):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_loja_id: str = payload.get("loja_id")

        if user_loja_id!= loja_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, loja_id)
    try:
        while True:
            await websocket.receive_text() # keepalive
    except WebSocketDisconnect:
        manager.disconnect(websocket, loja_id)
