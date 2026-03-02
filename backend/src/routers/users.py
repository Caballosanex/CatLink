from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import User, UserLogin, UserUpdateAdmin
from src.services import (
    authenticate_user,
    get_all_users,
    get_sessions_by_user,
    get_user_by_id,
    update_user,
)

router = APIRouter()


@router.post("/auth/login", response_model=User)
async def login(request: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(request.email, request.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    payload = {k: v for k, v in user.__dict__.items() if not k.startswith("_")}
    payload["password"] = None
    return User(**payload)


@router.get("/users", response_model=list[User])
async def list_users(db: AsyncSession = Depends(get_db)):
    users = await get_all_users(db)
    response = []
    for u in users:
        payload = {k: v for k, v in u.__dict__.items() if not k.startswith("_")}
        payload["password"] = None
        response.append(User(**payload))
    return response


@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    payload = {k: v for k, v in user.__dict__.items() if not k.startswith("_")}
    payload["password"] = None
    return User(**payload)


@router.put("/users/{user_id}", response_model=User)
async def update_user_admin(
    user_id: str,
    updates: UserUpdateAdmin,
    db: AsyncSession = Depends(get_db),
):
    user = await update_user(user_id, updates.model_dump(), db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    payload = {k: v for k, v in user.__dict__.items() if not k.startswith("_")}
    payload["password"] = None
    return User(**payload)


@router.get("/users/{user_id}/sessions")
async def get_user_sessions(user_id: str, db: AsyncSession = Depends(get_db)):
    sessions = await get_sessions_by_user(user_id, db)
    return [
        {
            k: v
            for k, v in s.__dict__.items()
            if not k.startswith("_")
        }
        for s in sessions
    ]
