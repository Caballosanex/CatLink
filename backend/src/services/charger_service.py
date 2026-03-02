from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db_models import ChargerDB
from src.services.nokia_service import nokia_service

async def get_all_chargers(db: AsyncSession) -> List[ChargerDB]:
    result = await db.execute(select(ChargerDB))
    return list(result.scalars().all())


async def get_charger_by_id(charger_id: str, db: AsyncSession) -> Optional[ChargerDB]:
    result = await db.execute(select(ChargerDB).where(ChargerDB.id == charger_id))
    return result.scalars().first()


async def get_charger_status(charger_id: str, db: AsyncSession) -> Optional[dict]:
    """Obtiene el estado de conectividad de un cargador (Nokia API)."""
    charger = await get_charger_by_id(charger_id, db)
    if not charger:
        return None
    
    status = await nokia_service.check_device_status(charger.iot_phone)
    return {
        "id": charger_id,
        "connected": status["connected"],
        "network_type": status.get("network_type"),
        "mock": status.get("mock", True)
    }


async def update_charger_status(charger_id: str, status: str, db: AsyncSession) -> Optional[ChargerDB]:
    charger = await get_charger_by_id(charger_id, db)
    if not charger:
        return None
    charger.status = status
    await db.commit()
    await db.refresh(charger)
    return charger


async def refresh_all_occupancies(db: AsyncSession) -> List[dict]:
    """Refresh AI occupancy for all non-offline chargers using Nokia Congestion API."""
    chargers = await get_all_chargers(db)
    results = []
    for charger in chargers:
        if charger.status == "offline":
            continue
        congestion = await nokia_service.get_congestion(charger.iot_phone)
        charger.ai_occupancy = congestion["occupancy_pct"]
        results.append({
            "id": charger.id,
            "name": charger.name,
            "congestion_level": congestion["congestion_level"],
            "occupancy_pct": congestion["occupancy_pct"],
            "mock": congestion.get("mock", True),
        })
    await db.commit()
    return results
