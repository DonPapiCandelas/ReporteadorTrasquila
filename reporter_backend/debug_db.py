import pyodbc
import time
from app.core.config import settings

print("--- INICIANDO DIAGNÓSTICO AVANZADO DE BASE DE DATOS ---")
print(f"DSN: {settings.SQLSERVER_REPORTING_DSN}")

try:
    # 1. Test de Conexión
    t0 = time.time()
    print("\n1. Intentando conectar a SQL Server...")
    conn = pyodbc.connect(settings.SQLSERVER_REPORTING_DSN, timeout=10)
    t1 = time.time()
    print(f"✅ Conexión exitosa en {t1-t0:.4f} segundos.")

    cursor = conn.cursor()

    # 2. Test de Vista Sucursales
    print("\n2. Probando vista 'zz_SucursalesReporte'...")
    t2 = time.time()
    cursor.execute("SELECT COUNT(*) FROM zz_SucursalesReporte WITH (NOLOCK)")
    count_suc = cursor.fetchone()[0]
    t3 = time.time()
    print(f"✅ Vista Sucursales OK. Registros: {count_suc}. Tiempo: {t3-t2:.4f} segundos.")

    # 3. Test de Productos
    print("\n3. Probando tabla 'admProductos'...")
    t4 = time.time()
    cursor.execute("SELECT TOP 5 CNOMBREPRODUCTO FROM admProductos WITH (NOLOCK)")
    prods = cursor.fetchall()
    t5 = time.time()
    print(f"✅ Tabla Productos OK. Leídos {len(prods)}. Tiempo: {t5-t4:.4f} segundos.")

    # 4. TEST DE VISTA PESADA (MOVIMIENTOS) - La prueba de fuego
    print("\n4. Probando vista PESADA 'zzVentasPorProducto'...")
    print("   (Si esto se tarda más de 5 segundos, aquí está el bloqueo)")
    t6 = time.time()
    # Pedimos solo 10 filas para ver si responde, no necesitamos contar todo
    cursor.execute("""
        SELECT TOP 10 CNOMBREPRODUCTO, Importe 
        FROM zzVentasPorProducto WITH (NOLOCK)
        ORDER BY id_pro DESC
    """)
    ventas = cursor.fetchall()
    t7 = time.time()
    print(f"✅ Vista VENTAS OK. Leídos {len(ventas)} registros recientes. Tiempo: {t7-t6:.4f} segundos.")

    conn.close()
    print("\n--- DIAGNÓSTICO FINALIZADO CON ÉXITO: EL SISTEMA VUELA 🚀 ---")

except pyodbc.OperationalError as e:
    print(f"\n❌ TIMEOUT O ERROR DE CONEXIÓN: {e}")
    print("Causa probable: Bloqueo en la base de datos o servidor saturado.")

except Exception as e:
    print(f"\n❌ ERROR GENERAL: {e}")