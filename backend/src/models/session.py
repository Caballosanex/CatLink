from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import Optional, List, Any


class SessionStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CHARGING = "charging"
    COMPLETED = "completed"


class AgentDecision(str, Enum):
    APPROVE = "APPROVE"
    REJECT_LOCATION = "REJECT_LOCATION"
    REJECT_IDENTITY = "REJECT_IDENTITY"
    REJECT_FRAUD = "REJECT_FRAUD"


class StartSessionRequest(BaseModel):
    charger_id: str
    user_phone: str
    user_lat: float
    user_lon: float
    user_id: Optional[str] = None
    battery_target: Optional[int] = None


class StopSessionRequest(BaseModel):
    session_id: str


class AgentLogEntry(BaseModel):
    timestamp: str
    tool: str
    input: dict
    output: dict


class SessionResponse(BaseModel):
    id: str
    charger_id: str
    user_phone: str
    user_id: Optional[str] = None
    status: SessionStatus
    decision: Optional[AgentDecision] = None
    reason: Optional[str] = None
    user_message: Optional[str] = None
    agent_logs: List[AgentLogEntry] = []
    qod_session_id: Optional[str] = None
    created_at: datetime
    ended_at: Optional[datetime] = None
    station_name: Optional[str] = None
    kwh_consumed: Optional[float] = None
    cost: Optional[float] = None
    price_per_kwh: Optional[float] = None
    duration_min: Optional[int] = None
    battery_start: Optional[int] = None
    battery_target: Optional[int] = None
    
    class Config:
        from_attributes = True
