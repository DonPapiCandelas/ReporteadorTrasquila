import pyodbc
import sys

ports = [63524, 63206, 59785]
target_db = "adCOMERCIALIZADORATRASQUILA"
user = "sa"
password = "Administrador1*"

print(f"--- Probing for database '{target_db}' ---")

found = False
for port in ports:
    print(f"\nChecking Port {port}...")
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER=host.docker.internal,{port};"
        f"UID={user};PWD={password};"
        "LoginTimeout=5;"
    )
    
    try:
        conn = pyodbc.connect(conn_str)
        print(f"✅ Connected to Port {port}!")
        
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sys.databases WHERE name = ?", target_db)
        row = cursor.fetchone()
        
        if row:
            print(f"🎉 FOUND DATABASE '{target_db}' ON PORT {port}!")
            found = True
            break
        else:
            print(f"❌ Database not found on this instance.")
        
        conn.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if not found:
    print("\n⚠️ Database not found on any instance.")
