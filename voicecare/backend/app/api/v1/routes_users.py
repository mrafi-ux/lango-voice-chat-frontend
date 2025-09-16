"""User management API routes."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.session import get_session
from ...db.crud import user_crud
from ...db.schemas import UserCreate, UserResponse
from ...core.logging import get_logger
from ...core.security import get_current_user
from ...db.models import User as UserModel

logger = get_logger(__name__)
router = APIRouter()


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_session)
) -> UserResponse:
    """Create a new user."""
    try:
        user = await user_crud.create(session, user_data)
        logger.info(f"Created user: {user.name} ({user.role})")
        return UserResponse.model_validate(user)
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise HTTPException(status_code=400, detail="Failed to create user")


@router.get("/", response_model=List[UserResponse])
async def get_users(
    session: AsyncSession = Depends(get_session)
) -> List[UserResponse]:
    """Get all users."""
    try:
        users = await user_crud.get_all(session)
        return [UserResponse.model_validate(user) for user in users]
    except Exception as e:
        logger.error(f"Failed to get users: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users")


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    session: AsyncSession = Depends(get_session)
) -> UserResponse:
    """Get user by ID."""
    try:
        user = await user_crud.get_by_id(session, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse.model_validate(user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserModel = Depends(get_current_user)) -> UserResponse:
    """Get the currently authenticated user."""
    return UserResponse.model_validate(current_user)
