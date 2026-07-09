from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, loja_id: str):
        await websocket.accept()
        if loja_id not in self.active_connections:
            self.active_connections[loja_id] = []
        self.active_connections[loja_id].append(websocket)

    def disconnect(self, websocket: WebSocket, loja_id: str):
        if loja_id in self.active_connections:
            if websocket in self.active_connections[loja_id]:
                self.active_connections[loja_id].remove(websocket)
            if not self.active_connections[loja_id]:
                del self.active_connections[loja_id]

    async def broadcast_to_loja(self, loja_id: str, message: dict):
        if loja_id in self.active_connections:
            for connection in self.active_connections[loja_id][:]:
                try:
                    await connection.send_json(message)
                except:
                    self.disconnect(connection, loja_id)

manager = ConnectionManager()
