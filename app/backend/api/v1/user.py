from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.db import get_db
from app.backend.schemas.user import UserRegister, UserLogin, UserResponse
from app.backend.services.user_service import UserService, EmailTakenError, InvalidCredentialsError

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    service = UserService(db)
    try:
        user = await service.register(data.username, data.email, data.password)
    except EmailTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Пользователь с таким email уже существует")
    return user


@router.post("/login", response_model=UserResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    service = UserService(db)
    try:
        user = await service.login(data.email, data.password)
    except InvalidCredentialsError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
    return user
