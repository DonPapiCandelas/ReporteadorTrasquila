from typing import Optional, List
from fastapi import APIRouter, Query, Depends

from app.schemas.reports import (
    VentasProductoKpis,
    VentasPorSucursalItem,
    VentasProductoFiltros,
    VentaPorHoraItem,
    TopProducto
)
from app.reports.ventas_producto_service import (
    calcular_kpis,
    resumen_por_sucursal_mes_actual,
    obtener_ventas_por_hora,
    top_productos,
    obtener_ventas_pago_por_dia
)
from app.api.deps import get_current_user

# Fix imports in case they weren't added at the top
from app.schemas.reports import (
    VentasProductoKpis,
    VentasPorSucursalItem,
    VentasProductoFiltros,
    VentaPorHoraItem,
    TopProducto,
    VentaPagoPorDiaItem
)

router = APIRouter()

def aplicar_candado(sucursal_input: Optional[str], user: dict) -> Optional[str]:
    """
    Aplica reglas de seguridad para filtrar por sucursal.
    
    Si el usuario no es administrador y tiene una sucursal asignada,
    se fuerza el filtro a esa sucursal, ignorando lo que haya solicitado.
    """
    if user["rol"] != "admin" and user["sucursal_registro"] != "TODAS":
        return user["sucursal_registro"]
    return sucursal_input

@router.get("/kpis", response_model=VentasProductoKpis)
def get_kpis(
    sucursal: Optional[str] = Query(None, description="Filtrar por sucursal"),
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mes (1-12)"),
    anio: Optional[int] = Query(None, description="Año"),
    producto: Optional[str] = Query(None, description="Filtrar por producto"),
    fecha_desde: Optional[str] = Query(None, description="Fecha inicio (YYYY-MM-DD)"),
    fecha_hasta: Optional[str] = Query(None, description="Fecha fin (YYYY-MM-DD)"),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene los KPIs principales (Venta Total, Ticket Promedio, etc.).
    """
    sucursal_segura = aplicar_candado(sucursal, current_user)
    
    filtros = VentasProductoFiltros(
        sucursal=sucursal_segura,
        mes=mes,
        anio=anio,
        producto=producto,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )
    return calcular_kpis(filtros)

@router.get("/ventas-por-sucursal", response_model=List[VentasPorSucursalItem])
def get_ventas_por_sucursal(
    sucursal: Optional[str] = Query(None),
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el resumen de ventas agrupado por sucursal.
    
    Si el usuario tiene permisos limitados, la lista solo contendrá su sucursal.
    """
    datos = resumen_por_sucursal_mes_actual(mes=mes, anio=anio)
    
    if current_user["rol"] != "admin" and current_user["sucursal_registro"] != "TODAS":
        sucursal_permitida = current_user["sucursal_registro"]
        datos = [d for d in datos if d["sucursal"] == sucursal_permitida]
        
    return datos

@router.get("/horas-pico", response_model=List[VentaPorHoraItem])
def get_horas_pico(
    sucursal: Optional[str] = Query(None),
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
    producto: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el análisis de ventas por hora para identificar horas pico.
    """
    sucursal_segura = aplicar_candado(sucursal, current_user)
    
    filtros = VentasProductoFiltros(
        sucursal=sucursal_segura,
        mes=mes,
        anio=anio,
        producto=producto,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )
    return obtener_ventas_por_hora(filtros)

@router.get("/top-productos", response_model=List[TopProducto])
def get_top_productos(
    sucursal: Optional[str] = Query(None),
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el ranking de los productos más vendidos.
    """
    sucursal_segura = aplicar_candado(sucursal, current_user)
    
    filtros = VentasProductoFiltros(
        sucursal=sucursal_segura,
        mes=mes,
        anio=anio
    )
    return top_productos(filtros)

@router.get("/pagos-por-dia", response_model=List[VentaPagoPorDiaItem])
def get_pagos_por_dia(
    sucursal: Optional[str] = Query(None),
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Obtiene el desglose de ventas por forma de pago agrupado por día.
    """
    sucursal_segura = aplicar_candado(sucursal, current_user)
    
    filtros = VentasProductoFiltros(
        sucursal=sucursal_segura,
        mes=mes,
        anio=anio,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta
    )
    return obtener_ventas_pago_por_dia(filtros)