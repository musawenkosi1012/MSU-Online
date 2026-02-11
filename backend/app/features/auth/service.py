"""
Auth Feature Service
Password hashing, JWT tokens, and user authentication.
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import User, get_db

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-local-dev-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")
logger = logging.getLogger(__name__)

class AuthService:
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

    def get_password_hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    def get_current_user(
        self,
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
    ) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            sub = payload.get("sub")
            if sub is None:
                raise credentials_exception
            
            # Support both ID (int) and Email (legacy str)
            user = None
            str_sub = str(sub)
            if str_sub.isdigit():
                 user = db.query(User).filter(User.id == int(str_sub)).first()
            
            if not user:
                 user = db.query(User).filter(User.email == str_sub).first()
                 
            if user is None:
                raise credentials_exception
                
            return user
        except JWTError:
            raise credentials_exception

    def get_current_user_optional(
        self,
        request: Request,
        db: Session = Depends(get_db)
    ) -> Optional[User]:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            sub = payload.get("sub")
            if sub is None:
                return None
            
            user = None
            str_sub = str(sub)
            if str_sub.isdigit():
                 user = db.query(User).filter(User.id == int(str_sub)).first()
            
            if not user:
                 user = db.query(User).filter(User.email == str_sub).first()
                 
            return user
        except JWTError:
            return None


auth_service = AuthService()
