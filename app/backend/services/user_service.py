from sqlalchemy.ext.asyncio import AsyncSession

from app.backend.repositories.user_repo import UserRepository
from app.backend.security import hash_password, verify_password


class EmailTakenError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class UserService:
    def __init__(self, db: AsyncSession):
        self.repo = UserRepository(db)

    async def register(self, username: str, email: str, password: str):
        existing = await self.repo.get_by_email(email)
        if existing:
            raise EmailTakenError()
        return await self.repo.create_user(username, email, hash_password(password))

    async def login(self, email: str, password: str):
        user = await self.repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()
        return user

    async def get_user(self, user_id: int):
        return await self.repo.get_by_id(user_id)
