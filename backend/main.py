from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.database import init_db
from src.routers import chargers, sessions, users
from src.websocket.manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="CatLink API",
    description="API para gestión inteligente de cargadores de VE con agente IA",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(chargers.router, prefix="/api/chargers", tags=["Chargers"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(users.router, prefix="/api", tags=["Users"])


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket para logs del agente en tiempo real."""
    await manager.connect(websocket)
    try:
        while True:
            # Mantener conexión abierta
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "catlink-api"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "CatLink API",
        "docs": "/docs",
        "health": "/health"
    }
