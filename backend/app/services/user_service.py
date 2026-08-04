from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.models.models import User

class UserService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)

    async def authenticate_user(self, user_id: int) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"User with ID {user_id} does not exist."
            )
        return user

    async def get_all_users(self) -> list[User]:
        return await self.user_repo.get_all()

    async def get_all_agents(self) -> list[User]:
        return await self.user_repo.get_agents()
