from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM
from app.core.database import get_auth_connection
from app.schemas.users import UserOut

# Esto le dice a Swagger UI dónde obtener el token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    conn = get_auth_connection()
    cursor = conn.cursor()
    try:
        # Buscamos al usuario en la BD
        cursor.execute("SELECT id, usuario, nombre, apellido, rol, estatus, sucursal_registro FROM admUsuariosWeb WHERE usuario = ?", (username,))
        user = cursor.fetchone()
        if user is None:
            raise credentials_exception
            
        return {
            "id": user[0],
            "usuario": user[1],
            "nombre": user[2],
            "apellido": user[3],
            "rol": user[4],
            "estatus": user[5],
            "sucursal_registro": user[6]
        }
    finally:
        conn.close()

def get_current_active_admin(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return current_user