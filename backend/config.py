"""Application configuration via environment variables (pydantic-settings)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""

    # AI endpoints
    skin_analysis_model_url: str = ""
    image_enhancement_model_url: str = ""
    ai_provider_api_key: str = ""
    ai_provider_base_url: str = "https://api.openai.com/v1"
    ai_provider_model: str = "gpt-4o-mini"

    # CORS
    cors_origins: str = "http://localhost:5173"

    # Supabase JWT secret (HS256 projects). Leave empty for RS256 (JWKS).
    supabase_jwt_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def analysis_model_configured(self) -> bool:
        return bool(self.skin_analysis_model_url)

    @property
    def enhancement_model_configured(self) -> bool:
        return bool(self.image_enhancement_model_url)

    @property
    def ai_provider_configured(self) -> bool:
        return bool(self.ai_provider_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
