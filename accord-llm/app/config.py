from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    llm_base_url: str = "http://127.0.0.1:8001/v1"
    llm_api_key: str | None = None
    llm_model: str | None = None
    request_timeout_seconds: float = 60.0
    temperature: float = 0.2
    top_p: float = 0.8
    max_tokens: int = 160
    reasoning_effort: str = "low"
    history_max_turns: int = 6
    session_ttl_minutes: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
