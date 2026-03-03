from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db_models import UserDB

#IMPORTANTE: Importamos las funciones de tu archivo security.py
from src.services.security import verify_password, get_password_hash


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
    """
    Autenticación segura usando Bcrypt.
    """
    # 1. Buscamos al usuario SOLO por email
    result = await db.execute(select(UserDB).where(UserDB.email == email))
    user = result.scalars().first()
    
    # 2. Si el usuario no existe, fallamos
    if not user:
        return None
        
    # 3. Comparamos la contraseña plana con el hash guardado en la DB
    if not verify_password(password, user.password):
        return None  # Contraseña incorrecta
        
    return user


async def update_user(user_id: str, updates: dict, db: AsyncSession) -> Optional[UserDB]:
    user = await get_user_by_id(user_id, db)
    if not user:
        return None
        
    for key, value in updates.items():
        if value is not None and hasattr(user, key):
            #tra de Seguridad: Si alguien actualiza su contraseña
            if key == "password":
                value = get_password_hash(value)
            setattr(user, key, value)
            
    await db.commit()
    await db.refresh(user)
    return user
