import time
from sqlalchemy import text
# Importamos tu configuración actual para probarla
from app.core.database import engine

print("--- INICIANDO PRUEBA DE POOL SQLALCHEMY ---")

try:
    # 1. Intentar obtener una conexión del Pool
    print("1. Solicitando conexión al Pool...")
    t0 = time.time()
    
    # Usamos 'connect()' para probar el engine de SQLAlchemy puro
    with engine.connect() as connection:
        t1 = time.time()
        print(f"✅ Conexión obtenida en {t1-t0:.4f} segundos.")
        
        # 2. Ejecutar consulta simple
        print("2. Ejecutando consulta de prueba...")
        result = connection.execute(text("SELECT 1"))
        print(f"✅ Consulta respondida: {result.fetchone()[0]}")

    print("\n--- ¡EXITO! EL POOL FUNCIONA CORRECTAMENTE ---")

except Exception as e:
    print("\n❌ ERROR FATAL DETECTADO:")
    print("-" * 30)
    print(e)
    print("-" * 30)
    print("TIP: Si dice 'Data source name not found', tu .env está mal escrito.")
    print("TIP: Si dice 'Login failed', revisa tu usuario/password.")