from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Query, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.reports import VentasProductoPage, ProductoOpcion
from app.reports import ventas_producto_service as service
from app.api.deps import get_current_user

import traceback 

router = APIRouter()

@router.get("/test")
def test():
    """
    Endpoint de prueba para verificar conectividad con este router.
    """
    return {"status": "ok"}

@router.get("/rows", response_model=VentasProductoPage)
def listar_ventas_producto(
    page: int = Query(1, ge=1, description="Número de página para paginación"),
    page_size: int = Query(50, ge=1, le=500, description="Cantidad de registros por página"),
    sucursal: Optional[str] = Query(None, description="Filtrar por nombre de sucursal"),
    producto: Optional[str] = Query(None, description="Filtrar por código o nombre de producto"),
    fecha_desde: Optional[date] = Query(None, description="Fecha inicial del rango (YYYY-MM-DD)"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha final del rango (YYYY-MM-DD)"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Filtrar por número de mes (1-12)"),
    anio: Optional[int] = Query(None, description="Filtrar por año (ej. 2023)"),
    ejecutar: bool = Query(False, description="Si es True, ejecuta la consulta. Si es False, retorna lista vacía (útil para carga inicial)."),
    current_user: dict = Depends(get_current_user),
):
    """
    Obtiene el listado detallado de ventas por producto con paginación.
    
    Aplica reglas de seguridad:
    - Si el usuario no es admin, solo puede ver datos de su sucursal asignada.
    """
    # Seguridad: Restringir sucursal si el usuario no es admin
    if current_user["rol"] != "admin" and current_user["sucursal_registro"] != "TODAS":
        sucursal = current_user["sucursal_registro"]

    data = service.listar_ventas_producto(
        page=page,
        page_size=page_size,
        sucursal=sucursal or None,
        producto=producto or None,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        mes=mes,
        anio=anio,
        ejecutar=ejecutar,
    )
    return data

@router.get("/sucursales", response_model=List[str])
def listar_sucursales(current_user: dict = Depends(get_current_user)):
    """
    Obtiene la lista de sucursales disponibles.
    
    Si el usuario tiene permisos limitados, solo retorna su propia sucursal.
    """
    if current_user["rol"] != "admin" and current_user["sucursal_registro"] != "TODAS":
        return [current_user["sucursal_registro"]]

    try:
        resultado = service.obtener_sucursales()
        return resultado
    except Exception as e:
        print(f"Error obteniendo sucursales: {e}")
        traceback.print_exc()
        raise e

@router.get("/productos", response_model=List[ProductoOpcion])
def listar_productos(
    q: Optional[str] = Query(None, description="Término de búsqueda (código o nombre)"),
    top: int = Query(50, ge=1, le=200, description="Máximo número de resultados a retornar"),
    current_user: dict = Depends(get_current_user)
):
    """
    Busca productos para el autocompletado de filtros.
    """
    return service.obtener_productos(q=q, top=top)

@router.get("/export/excel")
def exportar_excel(
    sucursal: Optional[str] = Query(None, description="Filtrar por sucursal"),
    producto: Optional[str] = Query(None, description="Filtrar por producto"),
    fecha_desde: Optional[date] = Query(None, description="Fecha inicio"),
    fecha_hasta: Optional[date] = Query(None, description="Fecha fin"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mes"),
    anio: Optional[int] = Query(None, description="Año"),
    current_user: dict = Depends(get_current_user),
):
    """
    Genera y descarga un archivo Excel con el reporte de ventas detallado.
    
    Aplica las mismas reglas de seguridad por sucursal que el listado.
    """
    if current_user["rol"] != "admin" and current_user["sucursal_registro"] != "TODAS":
        sucursal = current_user["sucursal_registro"]

    file_stream = service.exportar_ventas_excel(
        sucursal=sucursal or None,
        producto=producto or None,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        mes=mes,
        anio=anio,
    )
    
    filename = f"Reporte_Ventas_{date.today()}.xlsx"
    
    return StreamingResponse(
        file_stream, 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )