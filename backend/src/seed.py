from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import select

from src.database import AsyncSessionLocal
from src.db_models import ChargerDB, SessionDB, UserDB


DATA_DIR = Path(__file__).parent.parent / "data"
CHARGERS_PATH = DATA_DIR / "chargers.json"
USERS_PATH = DATA_DIR / "users.json"


def _make_avatar(name: str) -> str:
    parts = [p for p in name.replace("-", " ").split(" ") if p]
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return (parts[0][0:2] if parts else "CL").upper()


async def seed_if_empty() -> None:
    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(ChargerDB.id).limit(1))
        if existing.first():
            return

        with open(CHARGERS_PATH, "r") as f:
            chargers = json.load(f)

        now = datetime.now()
        for c in chargers:
            session.add(ChargerDB(
                id=c["id"],
                name=c["name"],
                address=c["address"],
                lat=c["lat"],
                lon=c["lon"],
                power_kw=c["power_kw"],
                connectors=c["connectors"],
                status=c["status"],
                zone=c["zone"],
                iot_phone=c["iot_phone"],
                last_heartbeat=now,
                ai_occupancy=0,
            ))

        with open(USERS_PATH, "r") as f:
            users = json.load(f)

        for u in users:
            session.add(UserDB(
                id=u["id"],
                name=u["name"],
                phone=u["phone"],
                email=u["email"],
                password="password123",
                vehicle=u["vehicle"],
                vehicle_plate="BCN-0000",
                avatar=_make_avatar(u["name"]),
                role="customer",
                verification_status="verified" if not u.get("is_fraud_test") else "pending",
                risk_level="high" if u.get("is_fraud_test") else "low",
                is_blocked=False,
                is_suspended=False,
                is_fraud_test=bool(u.get("is_fraud_test")),
                join_date=datetime.now().date().isoformat(),
            ))

        session.add(UserDB(
            id="USR-ADMIN",
            name="CatLink Admin",
            phone="+34911111111",
            email="admin@catlink.io",
            password="admin123",
            vehicle="",
            vehicle_plate="",
            avatar="CA",
            role="admin",
            verification_status="verified",
            risk_level="low",
            is_blocked=False,
            is_suspended=False,
            is_fraud_test=False,
            join_date=datetime.now().date().isoformat(),
        ))

        await session.commit()
