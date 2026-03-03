import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.db_models import UserDB
from src.services.security import get_password_hash

DATABASE_URL = "sqlite+aiosqlite:///catlink.db" 
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def hash_existing_passwords():
    print("🔄 Encriptando contraseñas antiguas de la BDD...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UserDB))
        users = result.scalars().all()
        
        count = 0
        for user in users:
            if not user.password:
                continue
                
            # Comprobamos si ya es un hash válido de bcrypt (empiezan por $2b$ o $2a$ y miden 60 chars)
            if user.password.startswith("$2") and len(user.password) == 60:
                continue
                
            # Encriptamos la contraseña (nuestra nueva función ya controla el límite de 72 bytes)
            user.password = get_password_hash(user.password)
            count += 1
                
        if count > 0:
            await db.commit()
            print(f"✅ ¡Éxito! {count} contraseñas han sido hasheadas.")
        else:
            print("👍 Todas las contraseñas ya estaban hasheadas correctamente.")

asyncio.run(hash_existing_passwords())
