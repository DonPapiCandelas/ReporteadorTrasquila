from typing import List, Optional, Any
from pydantic import BaseModel

class TicketRow(BaseModel):
    id_venta: int
    CNOMBREAGENTE: Optional[str]
    serie: Optional[str]
    folio: int
    fecha: str  # Fecha formateada o raw
    hora: str
    subtotal: float
    descuento: float
    impuesto: float
    total: float
    fEfectivo: float
    Tarjeta: float
    fVales: float
    fTrans: float
    fOtro: float
    fechaCancelado: Optional[str]
    cancelado: str
    CNOMBREALMACEN: str

class TicketKpis(BaseModel):
    total_vendido: float
    total_tickets: int
    total_cancelados: int
    promedio_ticket: float

class VentasPorAgenteItem(BaseModel):
    agente: str
    total: float
    cantidad_tickets: int

class TicketsResponse(BaseModel):
    data: List[TicketRow]
    total: int
    page: int
    size: int
    kpis: TicketKpis
