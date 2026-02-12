"""
Auth Feature Schemas
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import re

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    username: str
    email: EmailStr
    password: str
    confirm_password: str
    role: str = "student" # student or tutor
    
    # Profile
    dob: str # ISO string
    mobile_number: str
    national_id: str
    gender: str
    institutional_name: str
    
    # Tutor Fields
    title: Optional[str] = None
    department: Optional[str] = None
    pay_number: Optional[str] = None
    
    # Consents
    terms_accepted: bool
    privacy_accepted: bool
    data_consent_accepted: bool

    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

    @validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class LoginRequest(BaseModel):
    login_id: str # Can be email or username
    password: str


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    full_name: str
    username: str
    email: EmailStr
    role: str
    dob: Optional[datetime] = None
    mobile_number: Optional[str] = None
    national_id: Optional[str] = None
    gender: Optional[str] = None
    institutional_name: Optional[str] = None
    title: Optional[str] = None
    department: Optional[str] = None
    pay_number: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
