from fastapi import APIRouter, HTTPException
from typing import List
from src.models import StartSessionRequest, SessionResponse
from src.services import start_session, get_all_sessions, get_session_by_id, stop_session

router = APIRouter()


@router.post("/start", response_model=SessionResponse)
async def create_session(request: StartSessionRequest):
    """Inicia una sesión de carga (evaluada por el agente IA)."""
    try:
        session = await start_session(
            charger_id=request.charger_id,
            user_phone=request.user_phone,
            user_lat=request.user_lat,
            user_lon=request.user_lon
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/stop", response_model=SessionResponse)
async def end_session(session_id: str):
    """Detiene una sesión de carga."""
    session = await stop_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/", response_model=List[SessionResponse])
async def list_sessions():
    """Lista todas las sesiones."""
    return get_all_sessions()


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Obtiene una sesión por su ID."""
    session = get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
