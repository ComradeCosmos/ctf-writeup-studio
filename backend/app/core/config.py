import os
from pathlib import Path
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
EVIDENCE_DIR = DATA_DIR / "evidence"
EXPORTS_DIR = DATA_DIR / "exports"

DATA_DIR.mkdir(parents=True, exist_ok=True)
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    APP_NAME: str = "CTF Writeup Studio"
    VERSION: str = "2.4.0"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR / 'ctf_studio.db'}")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ctf-studio-insecure-secret-key-change-in-prod")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LOCAL_AGENT_TOKEN: str = os.getenv("LOCAL_AGENT_TOKEN", "ctf-local-agent-token-9842")
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
