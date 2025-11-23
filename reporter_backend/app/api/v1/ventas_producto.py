# app/api/v1/ventas_producto.py
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Query

from app.schemas.reports import VentasProductoPage, ProductoOpcion
from app.reports import ventas_producto_service as service

import traceback # <--- AGREGAR ESTE IMPORT AL INICIO DEL ARCHIVO
router = APIRouter(tags=["ventas-producto"])


@router.get("/test")
def test():
    return {"status": "ok"}


@router.get("/rows", response_model=VentasProductoPage)
def listar_ventas_producto(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sucursal: Optional[str] = None,
    producto: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
    ejecutar: bool = Query(False),
):
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
def listar_sucursales():
    print("\n--- DEBUG: INICIANDO PETICIÓN SUCURSALES ---")
    try:
        # Intentamos obtener los datos
        resultado = service.obtener_sucursales()
        print(f"--- DEBUG: ÉXITO. Se encontraron {len(resultado)} sucursales.")
        return resultado
    except Exception as e:
        # Si falla, imprimimos EL ERROR REAL en la consola
        print("\n" + "="*50)
        print("!!! ERROR FATAL EN API SUCURSALES !!!")
        print(f"Tipo de error: {type(e).__name__}")
        print(f"Mensaje: {str(e)}")
        print("-" * 20)
        print("TRACEBACK COMPLETO:")
        traceback.print_exc() # Esto imprime la línea exacta donde tronó
        print("="*50 + "\n")
        # Relanzamos el error para que FastAPI sepa que falló
        raise e


@router.get("/productos", response_model=List[ProductoOpcion])
def listar_productos(
    q: Optional[str] = Query(None, description="Búsqueda por código o nombre"),
    top: int = Query(50, ge=1, le=200),
):
    return service.obtener_productos(q=q, top=top)


from fastapi.responses import StreamingResponse

@router.get("/export/excel")
def exportar_excel(
    sucursal: Optional[str] = None,
    producto: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
):
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
