import uuid
from datetime import datetime
from typing import List, Optional
from src.models import SessionResponse, SessionStatus, AgentDecision, AgentLogEntry
from src.services.charger_service import get_charger_by_id
from src.agent.agent import agent

# In-memory storage para sesiones (suficiente para hackathon)
sessions_db: List[SessionResponse] = []


async def start_session(
    charger_id: str,
    user_phone: str,
    user_lat: float,
    user_lon: float
) -> SessionResponse:
    """Inicia una sesión de carga, evaluada por el agente IA."""
    
    # Obtener cargador
    charger = get_charger_by_id(charger_id)
    if not charger:
        raise ValueError(f"Charger {charger_id} not found")
    
    # Crear sesión pendiente
    session_id = f"SES-{uuid.uuid4().hex[:8].upper()}"
    
    # Evaluar con el agente
    result = await agent.evaluate_charge_request(
        charger=charger.model_dump(),
        user_phone=user_phone,
        user_lat=user_lat,
        user_lon=user_lon
    )
    
    # Determinar estado basado en decisión
    decision = AgentDecision(result["decision"])
    if decision == AgentDecision.APPROVE:
        status = SessionStatus.APPROVED
    else:
        status = SessionStatus.REJECTED
    
    # Crear respuesta de sesión
    session = SessionResponse(
        id=session_id,
        charger_id=charger_id,
        user_phone=user_phone,
        status=status,
        decision=decision,
        reason=result.get("reason", ""),
        user_message=result.get("user_message", ""),
        agent_logs=[AgentLogEntry(**log) for log in result.get("logs", [])],
        qod_session_id=result.get("qod_session_id"),
        created_at=datetime.now()
    )
    
    # Guardar en memoria
    sessions_db.append(session)
    
    return session


def get_all_sessions() -> List[SessionResponse]:
    """Obtiene todas las sesiones."""
    return sessions_db


def get_session_by_id(session_id: str) -> Optional[SessionResponse]:
    """Obtiene una sesión por su ID."""
    for session in sessions_db:
        if session.id == session_id:
            return session
    return None


async def stop_session(session_id: str) -> Optional[SessionResponse]:
    """Detiene una sesión de carga."""
    for i, session in enumerate(sessions_db):
        if session.id == session_id:
            sessions_db[i].status = SessionStatus.COMPLETED
            return sessions_db[i]
    return None
