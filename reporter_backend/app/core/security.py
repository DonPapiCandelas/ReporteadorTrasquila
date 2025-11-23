from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext

# --- CONFIGURACIÓN DE SEGURIDAD ---
# IMPORTANTE: En un entorno de producción real, SECRET_KEY debe estar en el archivo .env
# y no hardcodeada aquí.
SECRET_KEY = "LA_TRASQUILA_SECRET_KEY_2025" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12 # Duración de la sesión: 12 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """
    Verifica si una contraseña en texto plano coincide con su hash almacenado.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """
    Genera un hash seguro (bcrypt) a partir de una contraseña.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Genera un Token JWT (JSON Web Token) que sirve como credencial temporal.
    Incluye datos del usuario (payload) y una fecha de expiración.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt