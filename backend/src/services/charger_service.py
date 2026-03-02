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
