import pyodbc
from .config import settings

def get_connection():
    """
    Retorna una conexión directa a SQL Server para consultas de solo lectura.
    """
    conn = pyodbc.connect(settings.SQLSERVER_REPORTING_DSN)
    return conn
