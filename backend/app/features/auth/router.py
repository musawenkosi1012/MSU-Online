"""
Auth Feature Router
Authentication endpoints: signup, login, get current user.
Secure, robust, and async-optimized (thread-safe).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging

from app.core.database import User, get_db
from .service import auth_service
from .schemas import SignupRequest, LoginRequest, UserResponse, TokenResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user (Default Role: Student)."""
    try:
        # Enforce student role by default for security
        # Tutors/Admins must be upgraded manually or via admin API
        role = "student"
        
        new_user = User(
            full_name=request.full_name,
            email=request.email,
            hashed_password=auth_service.get_password_hash(request.password),
            role=role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"New user registered: {new_user.email} (ID: {new_user.id})")

        access_token = auth_service.create_access_token(
            data={"sub": str(new_user.id), "role": new_user.role}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Registration failed due to server error."
        )

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate and return a token."""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not auth_service.verify_password(request.password, user.hashed_password):
        # Log failed attempt (generic message to client)
        logger.warning(f"Failed login attempt for: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(auth_service.get_current_user)):
    """Get current authenticated user."""
    return current_user
