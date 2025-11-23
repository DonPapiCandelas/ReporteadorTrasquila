from fastapi import APIRouter, HTTPException, status
from app.core.database import get_auth_connection
from app.core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.schemas.users import UserCreate, UserLogin, Token
from datetime import timedelta, datetime

router = APIRouter()

@router.post("/register", response_model=dict)
def register(user: UserCreate):
    """
    Registra un nuevo usuario en el sistema.
    
    Lógica:
    1. Verifica si el nombre de usuario ya existe.
    2. Encripta la contraseña.
    3. Asigna rol 'admin' si es el primer usuario, de lo contrario 'usuario'.
    4. Asigna estatus 'activo' si es admin, de lo contrario 'pendiente'.
    """
    conn = get_auth_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Verificar si el usuario ya existe
        cursor.execute("SELECT id FROM admUsuariosWeb WHERE usuario = ?", (user.usuario,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Este nombre de usuario ya está ocupado.")

        # 2. Encriptar contraseña
        hashed_pwd = get_password_hash(user.password)
        
        # 3. Definir Rol inicial (El primer usuario de la historia es Admin, los demás Pendientes)
        cursor.execute("SELECT COUNT(*) FROM admUsuariosWeb")
        total_users = cursor.fetchone()[0]
        
        rol = "admin" if total_users == 0 else "usuario"
        estatus = "activo" if total_users == 0 else "pendiente"

        # 4. Insertar
        sql = """
            INSERT INTO admUsuariosWeb (usuario, password_hash, nombre, apellido, rol, estatus, sucursal_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        cursor.execute(sql, (user.usuario, hashed_pwd, user.nombre, user.apellido, rol, estatus, user.sucursal_registro))
        conn.commit()

        return {"message": "Usuario creado exitosamente. Espera aprobación del administrador."}

    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        print(f"Error registro: {e}")
        raise HTTPException(status_code=500, detail="Error interno al registrar usuario")
    finally:
        conn.close()

@router.post("/login", response_model=Token)
def login(user_data: UserLogin):
    """
    Autentica a un usuario y retorna un token de acceso (JWT).
    
    Validaciones:
    - Usuario y contraseña correctos.
    - Estatus del usuario (no puede ser 'pendiente' ni 'bloqueado').
    """
    conn = get_auth_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Buscar usuario por nombre de usuario
        cursor.execute("""
            SELECT id, usuario, password_hash, nombre, apellido, rol, estatus, sucursal_registro 
            FROM admUsuariosWeb WHERE usuario = ?
        """, (user_data.usuario,))
        
        user_db = cursor.fetchone()
        
        # Si no existe
        if not user_db:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
            
        # Mapeo de columnas:
        # 0:id, 1:usuario, 2:hash, 3:nombre, 4:apellido, 5:rol, 6:estatus, 7:sucursal
        
        # 2. Verificar contraseña
        if not verify_password(user_data.password, user_db[2]):
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

        # 3. Verificar Estatus (Candado de seguridad)
        estatus = user_db[6]
        if estatus == 'pendiente':
            raise HTTPException(status_code=403, detail="Tu cuenta está pendiente de aprobación.")
        if estatus == 'bloqueado':
            raise HTTPException(status_code=403, detail="Acceso denegado. Contacta al administrador.")

        # 4. Registrar último login
        cursor.execute("UPDATE admUsuariosWeb SET ultimo_login = GETDATE() WHERE id = ?", (user_db[0],))
        conn.commit()

        # 5. Generar Token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_db[1], "rol": user_db[5], "user_id": user_db[0]},
            expires_delta=access_token_expires
        )

        # 6. Responder
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_db[0],
                "usuario": user_db[1],
                "nombre": user_db[3],
                "apellido": user_db[4],
                "rol": user_db[5],
                "estatus": estatus,
                "sucursal_registro": user_db[7]
            }
        }

    finally:
        conn.close()