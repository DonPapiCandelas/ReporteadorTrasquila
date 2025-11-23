from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Datos básicos de un usuario
class UserBase(BaseModel):
    usuario: str
    nombre: str
    apellido: str
    sucursal_registro: Optional[str] = None # La sucursal que dice "ser"

# Lo que recibimos al crear cuenta (incluye password)
class UserCreate(UserBase):
    password: str

# Lo que recibimos al hacer login
class UserLogin(BaseModel):
    usuario: str
    password: str

# Lo que devolvemos al frontend (¡NUNCA el password!)
class UserOut(UserBase):
    id: int
    rol: str
    estatus: str
    ultimo_login: Optional[datetime] = None
    # Aquí podríamos devolver la lista de sucursales permitidas
    
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut # Enviamos los datos del usuario junto con el token

    # Clase para enviar actualizaciones desde el panel admin
# ... (código anterior igual)

class UserUpdate(BaseModel):
    estatus: Optional[str] = None
    rol: Optional[str] = None
    nombre: Optional[str] = None            # <--- Nuevo
    apellido: Optional[str] = None          # <--- Nuevo
    sucursal_registro: Optional[str] = None # <--- Nuevo
    password: Optional[str] = None          # <--- Nuevo (Opcional para reset)