from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from app.api.deps import get_current_user
from app.reports import tickets_service
from app.schemas.tickets import TicketsResponse, VentasPorAgenteItem

router = APIRouter()

@router.get("/", response_model=TicketsResponse)
def get_tickets(
    sucursal: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    semana: Optional[int] = None,
    anio: Optional[int] = None,
    mes: Optional[int] = None,
    page: int = 1,
    page_size: int = 50,
    current_user: dict = Depends(get_current_user)
):
    # Aplicar seguridad de sucursal
    if current_user["rol"] != "admin" and current_user["sucursal_registro"] != "TODAS":
        sucursal = current_user["sucursal_registro"]

    try:
        return tickets_service.listar_tickets(
            sucursal, fecha_inicio, fecha_fin, semana, anio, mes, page, page_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/agentes", response_model=List[VentasPorAgenteItem])
def get_ventas_agentes(
    sucursal: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    semana: Optional[int] = None,
    anio: Optional[int] = None,
    mes: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["rol"] != "admin" and current_user["sucursal_registro"] != "TODAS":
        sucursal = current_user["sucursal_registro"]

    try:
        return tickets_service.obtener_ventas_por_agente(
            sucursal, fecha_inicio, fecha_fin, semana, anio, mes
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
