from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.db import get_db
from app.backend.repositories.user_repo import UserRepository


async def get_current_user_id(
    x_user_id: int = Header(..., alias="X-User-Id"),
    db: AsyncSession = Depends(get_db),
) -> int:
    user = await UserRepository(db).get_by_id(x_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь не найден, войдите заново")
    return user.id
