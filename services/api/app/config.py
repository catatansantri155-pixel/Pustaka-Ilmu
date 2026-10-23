from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./pustaka.db"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 12
    admin_password: str = "admin12345"
    ai_api_base: str = ""
    ai_api_key: str = ""
    ai_model: str = "gpt-4o-mini"
    ai_cost_limit: float = 0
    login_rate_limit_per_minute: int = 60
    rate_limit_per_minute: int = 300
    redis_url: str = "redis://localhost:6379/0"
    celery_task_always_eager: bool = True
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
