from enum import Enum
from pydantic import BaseModel
from typing import Optional


class UserRole(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    PENDING = "pending"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class User(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    password: Optional[str] = None
    vehicle: str
    vehicle_plate: str
    avatar: str
    role: UserRole
    verification_status: VerificationStatus
    risk_level: RiskLevel
    is_blocked: bool = False
    is_suspended: bool = False
    is_fraud_test: bool = False
    join_date: str

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class UserUpdateAdmin(BaseModel):
    is_blocked: Optional[bool] = None
    is_suspended: Optional[bool] = None
    risk_level: Optional[RiskLevel] = None
