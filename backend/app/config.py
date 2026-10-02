"""Environment-driven settings for the SafePath backend."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", Path(".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Defaults to a local SQLite file so the app runs without Docker/PostgreSQL.
    # Point DATABASE_URL at PostgreSQL for the full stack described in the README.
    database_url: str = f"sqlite:///{(PROJECT_ROOT / 'backend' / 'safepath.db').as_posix()}"

    firebase_service_account_path: str = "./firebase-service-account.json"
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"

    # When no Firebase service account is present the backend still serves
    # requests, scoping them to a single shared demo user.
    demo_user_uid: str = "demo_priya_sharma"
    demo_user_name: str = "Priya Sharma"
    demo_user_email: str = "priya@safepath.app"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def firebase_credentials_file(self) -> Path | None:
        path = Path(self.firebase_service_account_path)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path if path.is_file() else None


settings = Settings()
