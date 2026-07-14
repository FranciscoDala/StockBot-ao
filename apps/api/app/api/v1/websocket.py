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
        # CORRECAO AQUI: usa settings.JWT_SECRET e settings.JWT_ALGORITHM
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_loja_id: str = payload.get("loja_id")

        if user_loja_id!= loja_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    except JWTError as e:
        print("JWT Error WS:", e) # pra debuggar
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, loja_id)
    try:
        while True:
            await websocket.receive_text() # keepalive
    except WebSocketDisconnect:
        manager.disconnect(websocket, loja_id)
