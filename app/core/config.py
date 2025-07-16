from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "Dynamic FastAPI Function Router"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    target_path: Optional[str] = None


settings = Settings()