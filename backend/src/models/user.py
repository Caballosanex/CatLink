from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    vehicle: str
    is_fraud_test: bool = False
