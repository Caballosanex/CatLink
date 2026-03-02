from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db_models import UserDB


async def get_all_users(db: AsyncSession) -> list[UserDB]:
    result = await db.execute(select(UserDB))
    return list(result.scalars().all())


async def get_user_by_id(user_id: str, db: AsyncSession) -> Optional[UserDB]:
    result = await db.execute(select(UserDB).where(UserDB.id == user_id))
    return result.scalars().first()


async def get_user_by_email(email: str, db: AsyncSession) -> Optional[UserDB]:
    result = await db.execute(select(UserDB).where(UserDB.email == email))
    return result.scalars().first()


async def authenticate_user(email: str, password: str, db: AsyncSession) -> Optional[UserDB]:
    result = await db.execute(
        select(UserDB).where(UserDB.email == email, UserDB.password == password)
    )
    return result.scalars().first()


async def update_user(user_id: str, updates: dict, db: AsyncSession) -> Optional[UserDB]:
    user = await get_user_by_id(user_id, db)
    if not user:
        return None
    for key, value in updates.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user
