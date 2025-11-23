from typing import List, Optional
from pydantic import BaseModel

class VentasProductoRow(BaseModel):
    fecha: Optional[str] = None
    hora: Optional[str] = None
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
    Folio: Optional[str] = None # Agregamos Folio por si acaso

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

# --- CLASES NUEVAS QUE FALTABAN ---

class VentaPorHoraItem(BaseModel):
    hora: int
    total_vendido: float
    transacciones: int

class TopProducto(BaseModel):
    codigo: str
    producto: str
    total_vendido: float
    cantidad_vendida: float

class VentasProductoKpis(BaseModel):
    total_vendido: float
    unidades_vendidas: float
    productos_distintos: int
    # Nuevo campo agregado
    ticket_promedio: float = 0.0
    sucursal_top: Optional[str] = None
    sucursal_top_total: Optional[float] = None