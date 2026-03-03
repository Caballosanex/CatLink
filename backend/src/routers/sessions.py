from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import StartSessionRequest, SessionResponse
from src.services import start_session, get_all_sessions, get_session_by_id, stop_session
from src.services.nokia_service import nokia_service

router = APIRouter()


@router.post("/start", response_model=SessionResponse)
async def create_session(request: StartSessionRequest, raw_request: Request, db: AsyncSession = Depends(get_db)):
    """Inicia una sesión de carga (evaluada por el agente IA)."""
    # Capture client IP for QoD session creation
    client_ip = raw_request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if not client_ip:
        client_ip = raw_request.client.host if raw_request.client else None
    nokia_service._current_client_ip = client_ip
    
    try:
        session = await start_session(
            charger_id=request.charger_id,
            user_phone=request.user_phone,
            user_lat=request.user_lat,
            user_lon=request.user_lon,
            user_id=request.user_id,
            battery_start=request.battery_start,
            battery_target=request.battery_target,
            db=db,
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{session_id}/stop", response_model=SessionResponse)
async def end_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Detiene una sesión de carga."""
    session = await stop_session(session_id, db)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(**{k: v for k, v in session.__dict__.items() if not k.startswith("_")})


@router.get("", response_model=List[SessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    """Lista todas las sesiones."""
    sessions = await get_all_sessions(db)
    return [SessionResponse(**{k: v for k, v in s.__dict__.items() if not k.startswith("_")}) for s in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Obtiene una sesión por su ID."""
    session = await get_session_by_id(session_id, db)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(**{k: v for k, v in session.__dict__.items() if not k.startswith("_")})
