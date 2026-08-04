from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.schemas import LoginRequest, UserResponse
from app.services.user_service import UserService

router = APIRouter(tags=["auth"])

@router.post("/login", response_model=UserResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    return await user_service.authenticate_user(payload.userId)

@router.get("/users", response_model=list[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    return await user_service.get_all_users()

@router.get("/agents", response_model=list[UserResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    user_service = UserService(db)
    return await user_service.get_all_agents()
