from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Configuración para que lea el archivo .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Variables que vamos a usar
    APP_ENV: str = "dev"
    APP_PORT: int = 9000
    SQLSERVER_REPORTING_DSN: str

# Instancia global de configuración
settings = Settings()
