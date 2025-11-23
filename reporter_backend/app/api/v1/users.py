from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_auth_connection
from app.schemas.users import UserOut, UserUpdate
from app.api.deps import get_current_active_admin
from app.core.security import get_password_hash 

router = APIRouter()

@router.get("/", response_model=List[UserOut])
def listar_usuarios(current_user: dict = Depends(get_current_active_admin)):
    """
    Obtiene la lista de todos los usuarios registrados.
    
    Solo accesible por administradores.
    Ordena los resultados mostrando primero los usuarios 'pendientes' para facilitar su aprobación.
    """
    conn = get_auth_connection()
    cursor = conn.cursor()
    try:
        # Traemos todos los usuarios ordenados por pendientes primero
        sql = """
            SELECT id, usuario, nombre, apellido, rol, estatus, sucursal_registro, ultimo_login 
            FROM admUsuariosWeb 
            ORDER BY CASE WHEN estatus = 'pendiente' THEN 0 ELSE 1 END, id DESC
        """
        cursor.execute(sql)
        rows = cursor.fetchall()
        
        usuarios = []
        for r in rows:
            usuarios.append({
                "id": r[0],
                "usuario": r[1],
                "nombre": r[2],
                "apellido": r[3],
                "rol": r[4],
                "estatus": r[5],
                "sucursal_registro": r[6],
                "ultimo_login": r[7],
                "sucursales_permitidas": [] 
            })
        return usuarios
    finally:
        conn.close()

@router.put("/{user_id}", response_model=dict)
def actualizar_usuario(user_id: int, datos: UserUpdate, current_user: dict = Depends(get_current_active_admin)):
    """
    Actualiza la información de un usuario.
    
    Permite cambiar:
    - Datos personales (nombre, apellido)
    - Rol y Estatus (aprobar, bloquear)
    - Sucursal asignada
    - Contraseña (si se proporciona, se encripta antes de guardar)
    """
    conn = get_auth_connection()
    cursor = conn.cursor()
    try:
        campos = []
        valores = []
        
        # Mapeo de campos simples
        if datos.nombre:
            campos.append("nombre = ?")
            valores.append(datos.nombre)
        if datos.apellido:
            campos.append("apellido = ?")
            valores.append(datos.apellido)
        if datos.estatus:
            campos.append("estatus = ?")
            valores.append(datos.estatus)
        if datos.rol:
            campos.append("rol = ?")
            valores.append(datos.rol)
        if datos.sucursal_registro:
            campos.append("sucursal_registro = ?")
            valores.append(datos.sucursal_registro)
            
        # Lógica especial para Password (Reset)
        if datos.password:
            hashed_pwd = get_password_hash(datos.password)
            campos.append("password_hash = ?")
            valores.append(hashed_pwd)
            
        if not campos:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")
            
        valores.append(user_id) # Para el WHERE
        
        sql = f"UPDATE admUsuariosWeb SET {', '.join(campos)} WHERE id = ?"
        cursor.execute(sql, valores)
        conn.commit()
        
        return {"message": "Usuario actualizado correctamente"}
    except Exception as e:
        conn.rollback()
        print(e)
        raise HTTPException(status_code=500, detail="Error al actualizar usuario")
    finally:
        conn.close()