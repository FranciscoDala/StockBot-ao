import json
import asyncio
from fastapi import WebSocket
from typing import Dict, List, Optional, Any
import redis.asyncio as redis
from app.core.config import settings

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.redis: Optional[redis.Redis] = None
        self.pubsub: Optional[Any] = None
        self.listen_task: Optional[asyncio.Task] = None

    async def connect_redis(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.pubsub = self.redis.pubsub()
        await self.pubsub.subscribe("stockbot:broadcast")
        self.listen_task = asyncio.create_task(self._redis_listener())

    async def _redis_listener(self):
        assert self.pubsub
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                loja_id = data.get("loja_id")
                payload = data.get("payload")
                await self._broadcast_local(loja_id, payload)

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

    async def _broadcast_local(self, loja_id: str, message: dict):
        if loja_id in self.active_connections:
            for connection in self.active_connections[loja_id][:]:
                try:
                    await connection.send_json(message)
                except:
                    self.disconnect(connection, loja_id)

    async def broadcast_to_loja(self, loja_id: str, message: dict):
        await self._broadcast_local(loja_id, message)
        if self.redis:
            data = json.dumps({"loja_id": loja_id, "payload": message})
            await self.redis.publish("stockbot:broadcast", data)

    async def close(self):
        if self.listen_task:
            self.listen_task.cancel()
        if self.pubsub:
            await self.pubsub.unsubscribe("stockbot:broadcast")
            await self.pubsub.close()
        if self.redis:
            await self.redis.close()

manager = ConnectionManager()
