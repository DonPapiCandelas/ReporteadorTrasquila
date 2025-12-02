from app.core.config import settings
import pyodbc
import sys

print("--- DEBUGGING REPORTING CONNECTION ---")
print(f"DSN: {settings.SQLSERVER_REPORTING_DSN}")

try:
    conn = pyodbc.connect(settings.SQLSERVER_REPORTING_DSN, timeout=10)
    print("✅ Connection SUCCESSFUL!")
    conn.close()
except Exception as e:
    print(f"❌ Connection FAILED: {e}")
