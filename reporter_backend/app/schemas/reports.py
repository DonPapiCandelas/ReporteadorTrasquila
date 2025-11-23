from typing import List, Optional
from pydantic import BaseModel


class VentasProductoRow(BaseModel):

    Mes: str
    id_pro: int
    CCODIGOPRODUCTO: str
    CNOMBREPRODUCTO: str
    cantidad: float
    CNOMBREUNIDAD: Optional[str] = None
    precio: float
    Importe: float
    descuento: float
    impuesto: float
    Total: float
    CNOMBREALMACEN: Optional[str] = None

class ProductoOpcion(BaseModel):
    id_pro: int
    codigo: str
    nombre: str

class VentasProductoPage(BaseModel):
    total_items: int
    page: int
    page_size: int
    items: List[VentasProductoRow]


class VentasProductoFiltros(BaseModel):
    sucursal: Optional[str] = None
    mes: Optional[int] = None
    anio: Optional[int] = None
    fecha_desde: Optional[str] = None
    fecha_hasta: Optional[str] = None
    producto: Optional[str] = None


class VentasPorSucursalItem(BaseModel):
    sucursal: Optional[str]
    total_vendido: float


class VentasProductoKpis(BaseModel):
    total_vendido: float
    unidades_vendidas: float
    productos_distintos: int
    sucursal_top: Optional[str] = None
    sucursal_top_total: Optional[float] = None
