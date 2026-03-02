import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Nokia API
    nokia_api_token: str = ""
    nokia_mock_mode: bool = False  # Default to real APIs for hackathon
    
    # Google Gemini
    gemini_api_key: str = ""
    
    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
