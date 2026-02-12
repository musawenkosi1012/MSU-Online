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
    """Register a new user with comprehensive details."""
    try:
        # Check if email or username exists
        if db.query(User).filter(User.email == request.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        if db.query(User).filter(User.username == request.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")

        # Derive full name
        name_parts = [request.first_name]
        if request.middle_name:
            name_parts.append(request.middle_name)
        name_parts.append(request.last_name)
        full_name = " ".join(name_parts)

        # Parse DOB
        try:
            from datetime import datetime
            dob_dt = datetime.fromisoformat(request.dob.replace('Z', '+00:00'))
        except:
            dob_dt = None

        new_user = User(
            first_name=request.first_name,
            last_name=request.last_name,
            middle_name=request.middle_name,
            full_name=full_name,
            username=request.username,
            email=request.email,
            hashed_password=auth_service.get_password_hash(request.password),
            role=request.role, # Allow role from request for this specific requirement
            dob=dob_dt,
            mobile_number=request.mobile_number,
            national_id=request.national_id,
            gender=request.gender,
            institutional_name=request.institutional_name,
            title=request.title,
            department=request.department,
            pay_number=request.pay_number,
            terms_accepted=request.terms_accepted,
            privacy_accepted=request.privacy_accepted,
            data_consent_accepted=request.data_consent_accepted
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"New user registered: {new_user.username} (ID: {new_user.id})")

        access_token = auth_service.create_access_token(
            data={"sub": str(new_user.id), "role": new_user.role}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate via username or email."""
    user = db.query(User).filter(
        (User.email == request.login_id) | (User.username == request.login_id)
    ).first()
    
    if not user or not auth_service.verify_password(request.password, user.hashed_password):
        logger.warning(f"Failed login attempt for: {request.login_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect username/email or password",
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
