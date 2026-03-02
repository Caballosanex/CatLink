from fastapi import WebSocket
from typing import List
import json


class ConnectionManager:
    """Gestiona conexiones WebSocket para logs en tiempo real."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Acepta y registra una nueva conexión."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Elimina una conexión."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Envía mensaje a todos los clientes conectados."""
        if not self.active_connections:
            return
        
        dead_connections = []
        message_json = json.dumps(message)
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                print(f"Error sending to WebSocket: {e}")
                dead_connections.append(connection)
        
        # Limpiar conexiones muertas
        for conn in dead_connections:
            self.disconnect(conn)
    
    async def send_to(self, websocket: WebSocket, message: dict):
        """Envía mensaje a un cliente específico."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"Error sending to WebSocket: {e}")
            self.disconnect(websocket)


# Singleton
manager = ConnectionManager()
