from fastapi import APIRouter, Depends, HTTPException
from typing import List
from src.models import Charger, ChargerStatusResponse
from src.services import get_all_chargers, get_charger_by_id, get_charger_status, refresh_all_occupancies
from src.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("", response_model=List[Charger])
async def list_chargers(db: AsyncSession = Depends(get_db)):
    """Lista todos los cargadores."""
    return await get_all_chargers(db)


@router.get("/{charger_id}", response_model=Charger)
async def get_charger(charger_id: str, db: AsyncSession = Depends(get_db)):
    """Obtiene un cargador por su ID."""
    charger = await get_charger_by_id(charger_id, db)
    if not charger:
        raise HTTPException(status_code=404, detail="Charger not found")
    return charger


@router.post("/refresh-occupancy")
async def refresh_occupancy(db: AsyncSession = Depends(get_db)):
    """Refresh AI occupancy for all chargers using Nokia Congestion Insights API."""
    results = await refresh_all_occupancies(db)
    return {"updated": len(results), "chargers": results}


@router.get("/{charger_id}/status", response_model=ChargerStatusResponse)
async def get_status(charger_id: str, db: AsyncSession = Depends(get_db)):
    """Obtiene el estado de conectividad de un cargador (Nokia API)."""
    status = await get_charger_status(charger_id, db)
    if not status:
        raise HTTPException(status_code=404, detail="Charger not found")
    return status
