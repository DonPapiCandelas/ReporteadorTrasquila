from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from .config import settings

# --- 1. MOTOR DE REPORTES (CONTPAQi) ---
# Se utiliza para consultas de lectura pesadas (Ventas, Productos).
url_reporting = URL.create("mssql+pyodbc", query={"odbc_connect": settings.SQLSERVER_REPORTING_DSN})
engine_reporting = create_engine(
    url_reporting,
    pool_size=10, max_overflow=20, pool_timeout=30, pool_recycle=1800, pool_pre_ping=True
)

# --- 2. MOTOR DE AUTH (Usuarios) ---
# Se utiliza para la gestión de usuarios y sesiones.
url_auth = URL.create("mssql+pyodbc", query={"odbc_connect": settings.SQLSERVER_AUTH_DSN})
engine_auth = create_engine(
    url_auth,
    pool_size=5, max_overflow=10, pool_timeout=30, pool_recycle=1800, pool_pre_ping=True
)

print("--- MOTORES SQL INICIALIZADOS: REPORTING + AUTH ---")

def get_connection():
    """
    Obtiene una conexión directa (raw) a la base de datos de Reportes (CONTPAQi).
    Útil para ejecutar Stored Procedures o consultas complejas.
    """
    try:
        return engine_reporting.raw_connection()
    except Exception as e:
        print(f"!!! ERROR DB REPORTING: {e}")
        raise e

def get_auth_connection():
    """
    Obtiene una conexión directa (raw) a la base de datos de Autenticación.
    """
    try:
        return engine_auth.raw_connection()
    except Exception as e:
        print(f"!!! ERROR DB AUTH: {e}")
        raise e