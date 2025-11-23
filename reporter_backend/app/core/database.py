from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from .config import settings

# --- CONSTRUCCIÓN SEGURA DE LA URL ---
connection_url = URL.create(
    "mssql+pyodbc",
    query={"odbc_connect": settings.SQLSERVER_REPORTING_DSN}
)

print(f"--- INICIANDO POOL SQLALCHEMY (MOTOR DE VELOCIDAD) ---")

# Creamos el Engine (La Piscina de Conexiones)
engine = create_engine(
    connection_url,
    pool_size=10,        # 10 conexiones siempre listas
    max_overflow=20,     # Hasta 20 extra si hay mucha carga
    pool_timeout=30,     # Espera máxima
    pool_recycle=1800,   # Reciclar cada 30 min
    pool_pre_ping=True   # Verificar que la conexión sirve antes de usarla
)

def get_connection():
    """
    Retorna una conexión del Pool.
    Es vital para que el sistema no se trabe con muchos usuarios.
    """
    try:
        return engine.raw_connection()
    except Exception as e:
        print(f"!!! ERROR CRÍTICO DB: {e}")
        raise e