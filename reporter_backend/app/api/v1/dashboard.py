from typing import Optional, List

from fastapi import APIRouter, Query

from app.schemas.reports import (
    VentasProductoKpis,
    VentasPorSucursalItem,
    VentasProductoFiltros,
)
from app.reports.ventas_producto_service import (
    calcular_kpis,
    ventas_por_sucursal,
    resumen_por_sucursal_mes_actual,
)

router = APIRouter()


@router.get("/kpis", response_model=VentasProductoKpis)
def get_kpis(
    sucursal: Optional[str] = Query(None),
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
    producto: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
):
    filtros = VentasProductoFiltros(
        sucursal=sucursal,
        mes=mes,
        anio=anio,
        producto=producto,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
    )
    return calcular_kpis(filtros)


@router.get("/ventas-por-sucursal", response_model=List[VentasPorSucursalItem])
def get_ventas_por_sucursal(
    mes: Optional[int] = Query(None, ge=1, le=12),
    anio: Optional[int] = Query(None),
):
    """
    Resumen de ventas del mes/año por sucursal
    para el dashboard de bienvenida.
    """
    return resumen_por_sucursal_mes_actual(mes=mes, anio=anio)
