from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # OpenAI
    OPENAI_API_KEY: str

    # Base/Web3
    BASE_RPC_URL: str
    PRIVATE_KEY: Optional[str] = None
    PROFILE_NFT_CONTRACT: Optional[str] = None
    CONNECTION_NFT_CONTRACT: Optional[str] = None
    PESOBYTES_CONTRACT: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # App Config
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
