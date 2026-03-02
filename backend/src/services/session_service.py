import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db_models import SessionDB
from src.models import SessionResponse, SessionStatus, AgentDecision, AgentLogEntry
from src.services.charger_service import get_charger_by_id
from src.agent.agent import agent


async def start_session(
    charger_id: str,
    user_phone: str,
    user_lat: float,
    user_lon: float,
    db: AsyncSession,
    user_id: Optional[str] = None,
) -> SessionResponse:
    """Inicia una sesión de carga, evaluada por el agente IA."""
    
    # Obtener cargador
    charger = await get_charger_by_id(charger_id, db)
    if not charger:
        raise ValueError(f"Charger {charger_id} not found")
    
    # Crear sesión pendiente
    session_id = f"SES-{uuid.uuid4().hex[:8].upper()}"
    
    charger_payload = {
        "id": charger.id,
        "name": charger.name,
        "lat": charger.lat,
        "lon": charger.lon,
        "power_kw": charger.power_kw,
        "connectors": charger.connectors,
        "status": charger.status,
        "zone": charger.zone,
        "address": charger.address,
        "iot_phone": charger.iot_phone,
    }

    # Evaluar con el agente
    try:
        result = await agent.evaluate_charge_request(
            charger=charger_payload,
            user_phone=user_phone,
            user_lat=user_lat,
            user_lon=user_lon,
        )
    except Exception as e:
        import traceback
        print(f"[AGENT ERROR] {e}")
        traceback.print_exc()
        result = {
            "decision": AgentDecision.APPROVE.value,
            "reason": "Agent unavailable, auto-approved for demo",
            "user_message": "Charging approved. Agent offline.",
            "logs": [],
            "qod_session_id": None,
        }
    
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
        user_id=user_id,
        status=status,
        decision=decision,
        reason=result.get("reason", ""),
        user_message=result.get("user_message", ""),
        agent_logs=[AgentLogEntry(**log) for log in result.get("logs", [])],
        qod_session_id=result.get("qod_session_id"),
        created_at=datetime.now(),
        station_name=charger.name,
    )

    db_row = SessionDB(
        id=session.id,
        charger_id=session.charger_id,
        user_phone=session.user_phone,
        user_id=session.user_id,
        status=session.status.value,
        decision=session.decision.value if session.decision else None,
        reason=session.reason,
        user_message=session.user_message,
        agent_logs=[log.model_dump() for log in session.agent_logs],
        qod_session_id=session.qod_session_id,
        created_at=session.created_at,
        station_name=session.station_name,
    )
    db.add(db_row)
    await db.commit()
    return session


async def get_all_sessions(db: AsyncSession) -> List[SessionDB]:
    result = await db.execute(select(SessionDB))
    return list(result.scalars().all())


async def get_session_by_id(session_id: str, db: AsyncSession) -> Optional[SessionDB]:
    result = await db.execute(select(SessionDB).where(SessionDB.id == session_id))
    return result.scalars().first()


async def stop_session(session_id: str, db: AsyncSession) -> Optional[SessionDB]:
    session = await get_session_by_id(session_id, db)
    if not session:
        return None

    charger = await get_charger_by_id(session.charger_id, db)
    now = datetime.now()
    duration_min = int((now - session.created_at).total_seconds() // 60)
    price_per_kwh = 0.40
    power_kw = charger.power_kw if charger else 0
    kwh_consumed = round((duration_min / 60) * power_kw * 0.9, 2)
    cost = round(kwh_consumed * price_per_kwh, 2)

    session.status = SessionStatus.COMPLETED.value
    session.ended_at = now
    session.duration_min = duration_min
    session.price_per_kwh = price_per_kwh
    session.kwh_consumed = kwh_consumed
    session.cost = cost

    await db.commit()
    await db.refresh(session)
    return session


async def get_sessions_by_user(user_id: str, db: AsyncSession) -> List[SessionDB]:
    result = await db.execute(select(SessionDB).where(SessionDB.user_id == user_id))
    return list(result.scalars().all())
