from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "development"
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000"]

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/originlens"
    redis_url: str = "redis://localhost:6379/0"

    # Supabase Auth: HS256 legacy secret if set, otherwise JWKS from the project URL.
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    supabase_jwt_audience: str = "authenticated"

    # Upload / fetch limits
    max_upload_bytes: int = 15 * 1024 * 1024
    max_image_pixels: int = 60_000_000
    url_fetch_timeout_s: float = 8.0
    url_fetch_max_redirects: int = 3
    exiftool_path: str = "exiftool"

    # LLM providers (OpenAI-compatible chat APIs)
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "meta-llama/llama-3.3-70b-instruct"
    groq_api_key: str = ""
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama-3.3-70b-versatile"
    llm_timeout_s: float = 30.0
    llm_max_retries: int = 2
    llm_breaker_failures: int = 5
    llm_breaker_cooldown_s: int = 60
    max_text_chars: int = 20_000

    # Rate limits & quotas (per day). Anonymous = keyed by client IP.
    rate_limit_per_minute: int = 60
    quotas: dict[str, dict[str, int]] = Field(
        default={
            "anonymous": {"image": 10, "text": 5, "llm": 2},
            "free": {"image": 30, "text": 20, "llm": 10},
            "pro": {"image": 500, "text": 300, "llm": 150},
        }
    )
    trusted_proxy_count: int = 0

    # Pricing
    pro_price_usd: float = 6.0
    usd_inr_fallback_rate: float = 84.0
    fx_api_url: str = "https://open.er-api.com/v6/latest/USD"


@lru_cache
def get_settings() -> Settings:
    return Settings()
