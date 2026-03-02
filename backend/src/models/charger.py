from pydantic import BaseModel
from enum import Enum
from typing import List, Optional


class ChargerStatus(str, Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class Charger(BaseModel):
    id: str
    name: str
    address: str
    lat: float
    lon: float
    power_kw: int
    connectors: List[str]
    status: ChargerStatus
    zone: str
    iot_phone: str


class ChargerResponse(Charger):
    distance_km: Optional[float] = None


class ChargerStatusResponse(BaseModel):
    id: str
    connected: bool
    network_type: Optional[str] = None
