import sqlite3
import sys
import os

# Add the current directory to sys.path to import app modules
sys.path.append(os.getcwd())

from app.core.security import get_password_hash

DB_FILE = "auth.db"

def reset_password():
    if not os.path.exists(DB_FILE):
        print(f"Error: Database file '{DB_FILE}' not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, usuario, nombre, apellido, rol FROM admUsuariosWeb")
        users = cursor.fetchall()
    except sqlite3.Error as e:
        print(f"Error reading database: {e}")
        conn.close()
        return

    if not users:
        print("No users found in the database.")
        conn.close()
        return

    print("\n--- Users Found ---")
    for user in users:
        print(f"ID: {user[0]} | Username: {user[1]} | Name: {user[2]} {user[3]} | Role: {user[4]}")
    print("-------------------")

    while True:
        try:
            user_id_str = input("\nEnter the ID of the user to reset password (or 'q' to quit): ")
            if user_id_str.lower() == 'q':
                conn.close()
                return
            
            user_id = int(user_id_str)
            
            # Verify user exists
            cursor.execute("SELECT usuario FROM admUsuariosWeb WHERE id = ?", (user_id,))
            result = cursor.fetchone()
            
            if result:
                username = result[0]
                break
            else:
                print("User ID not found. Please try again.")
        except ValueError:
            print("Invalid input. Please enter a number.")

    new_password = input(f"Enter new password for user '{username}': ")
    if not new_password:
        print("Password cannot be empty.")
        conn.close()
        return

    hashed_password = get_password_hash(new_password)

    try:
        cursor.execute("UPDATE admUsuariosWeb SET password_hash = ? WHERE id = ?", (hashed_password, user_id))
        conn.commit()
        print(f"\nSuccess! Password for user '{username}' (ID: {user_id}) has been updated.")
    except sqlite3.Error as e:
        print(f"Error updating password: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    reset_password()
