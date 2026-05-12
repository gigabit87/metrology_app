from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

    



class CalculationHistoryCreate(BaseModel):
    calculation_type: str
    input_data: Dict[str, Any]
    results: Dict[str, Any]

class CalculationHistoryResponse(BaseModel):
    id: int
    user_id: int
    calculation_type: str
    input_data: Dict[str, Any]
    results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True