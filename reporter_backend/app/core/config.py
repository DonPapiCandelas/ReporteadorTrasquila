from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Configuración global de la aplicación.
    
    Lee las variables desde el archivo .env o variables de entorno del sistema.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore" # Ignora variables extra en el .env que no estén definidas aquí
    )

    APP_ENV: str = "dev"
    APP_PORT: int = 9000
    
    # --- CONEXIONES A BASE DE DATOS ---
    # SQLSERVER_REPORTING_DSN: Cadena de conexión para la BD de CONTPAQi (Datos de ventas)
    # SQLSERVER_AUTH_DSN: Cadena de conexión para la BD de Usuarios (Login, permisos)
    SQLSERVER_REPORTING_DSN: str
    SQLSERVER_AUTH_DSN: str

settings = Settings()