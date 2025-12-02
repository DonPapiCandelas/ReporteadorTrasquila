from app.core.config import settings
import pyodbc
import sys

print("--- DEBUGGING VIEWS ---")
print(f"DSN: {settings.SQLSERVER_REPORTING_DSN}")

sucursal = "EL DINAMICO"
mes = 11
anio = 2025

try:
    conn = pyodbc.connect(settings.SQLSERVER_REPORTING_DSN, timeout=10)
    cursor = conn.cursor()

    # 1. Check zzVentasResumen (Used by KPIs)
    print(f"\n1. Checking zzVentasResumen for {sucursal} - {mes}/{anio}...")
    sql_resumen = """
        SELECT COUNT(*), SUM(total_venta)
        FROM zzVentasResumen WITH (NOLOCK)
        WHERE sucursal = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
    """
    cursor.execute(sql_resumen, (sucursal, mes, anio))
    row = cursor.fetchone()
    print(f"   Rows: {row[0]}, Total Venta: {row[1]}")

    # 2. Check zzVentasPorProducto (Used by Top Products)
    print(f"\n2. Checking zzVentasPorProducto for {sucursal} - {mes}/{anio}...")
    # Note: zzVentasPorProducto uses CNOMBREALMACEN instead of sucursal
    sql_detalle = """
        SELECT COUNT(*), SUM(Total)
        FROM zzVentasPorProducto WITH (NOLOCK)
        WHERE CNOMBREALMACEN = ? AND MONTH(fecha) = ? AND YEAR(fecha) = ?
    """
    cursor.execute(sql_detalle, (sucursal, mes, anio))
    row = cursor.fetchone()
    print(f"   Rows: {row[0]}, Total Venta: {row[1]}")

    conn.close()

except Exception as e:
    print(f"❌ ERROR: {e}")
