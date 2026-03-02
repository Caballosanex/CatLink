from fastapi import APIRouter, HTTPException
from typing import List
from src.models import Charger, ChargerStatusResponse
from src.services import get_all_chargers, get_charger_by_id, get_charger_status

router = APIRouter()


@router.get("/", response_model=List[Charger])
async def list_chargers():
    """Lista todos los cargadores."""
    return get_all_chargers()


@router.get("/{charger_id}", response_model=Charger)
async def get_charger(charger_id: str):
    """Obtiene un cargador por su ID."""
    charger = get_charger_by_id(charger_id)
    if not charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    return charger


@router.get("/{charger_id}/status", response_model=ChargerStatusResponse)
async def get_status(charger_id: str):
    """Obtiene el estado de conectividad de un cargador (Nokia API)."""
    status = await get_charger_status(charger_id)
    if not status:
        raise HTTPException(status_code=404, detail="Charger not found")
    return status
