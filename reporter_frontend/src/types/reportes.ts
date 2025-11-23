// src/types/reportes.ts

export interface VentasProductoRow {
    fecha: string;
    hora: string; // <--- AGREGAR ESTO
    Mes: string;
    id_pro: number;
    CCODIGOPRODUCTO: string;
    CNOMBREPRODUCTO: string;
    cantidad: number;
    CNOMBREUNIDAD: string | null;
    precio: number;
    Importe: number;
    descuento: number;
    impuesto: number;
    Total: number;
    CNOMBREALMACEN: string | null;
}

// ... (el resto del archivo sigue igual)
export interface VentasProductoPage {
    items: VentasProductoRow[];
    total_items: number;
    page: number;
    page_size: number;
}

export interface VentasProductoKpis {
    total_vendido: number;
    unidades_vendidas: number;
    productos_distintos: number;
    sucursal_top: string | null;
    sucursal_top_total: number | null;
}

export interface TopProducto {
    codigo: string;
    producto: string;
    total_vendido: number;
    cantidad_vendida: number;
}

export interface VentasPorSucursal {
    sucursal: string | null;
    total_vendido: number;
}

export interface PuntoTimeline {
    fecha: string;
    total_vendido: number;
}

export interface ProductoOpcion {
    id_pro: number;
    codigo: string;
    nombre: string;
}