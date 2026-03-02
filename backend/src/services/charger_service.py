import json
from pathlib import Path
from typing import List, Optional
from src.models import Charger, ChargerStatus
from src.services.nokia_service import nokia_service

DATA_PATH = Path(__file__).parent.parent.parent / "data" / "chargers.json"


def load_chargers() -> List[Charger]:
    """Carga los cargadores desde el archivo JSON."""
    with open(DATA_PATH, "r") as f:
        data = json.load(f)
    return [Charger(**c) for c in data]


def get_all_chargers() -> List[Charger]:
    """Obtiene todos los cargadores."""
    return load_chargers()


def get_charger_by_id(charger_id: str) -> Optional[Charger]:
    """Obtiene un cargador por su ID."""
    chargers = load_chargers()
    for charger in chargers:
        if charger.id == charger_id:
            return charger
    return None


async def get_charger_status(charger_id: str) -> Optional[dict]:
    """Obtiene el estado de conectividad de un cargador (Nokia API)."""
    charger = get_charger_by_id(charger_id)
    if not charger:
        return None
    
    status = await nokia_service.check_device_status(charger.iot_phone)
    return {
        "id": charger_id,
        "connected": status["connected"],
        "network_type": status.get("network_type"),
        "mock": status.get("mock", True)
    }
