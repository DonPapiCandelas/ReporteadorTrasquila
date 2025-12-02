import sqlite3
import os

DB_FILE = "auth.db"

def init_db():
    if os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} already exists.")
        return

    print(f"Creating database {DB_FILE}...")
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Create admUsuariosWeb table
    # Schema based on auth.py usage:
    # id, usuario, password_hash, nombre, apellido, rol, estatus, sucursal_registro, ultimo_login
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admUsuariosWeb (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            nombre TEXT,
            apellido TEXT,
            rol TEXT,
            estatus TEXT,
            sucursal_registro TEXT,
            ultimo_login DATETIME
        )
    """)
    
    print("Table 'admUsuariosWeb' created.")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
