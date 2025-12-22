// src/types/reportes.ts

export interface VentasProductoRow {
    fecha: string;
    hora: string;
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
    Folio?: string; // Agregamos el opcional por si acaso
}

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
    // --- AGREGAR ESTA LÍNEA ---
    ticket_promedio: number;
    // --------------------------
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
    total_efectivo?: number;
    total_tarjeta?: number;
    total_vales?: number;
    total_transferencia?: number;
    total_otro?: number;
}

export interface VentaPagoPorDia {
    fecha: string;
    total_efectivo: number;
    total_tarjeta: number;
    total_vales: number;
    total_transferencia: number;
    total_otro: number;
    total_general: number;
}

// Si usaste 'any' en el dashboard no necesitas este, pero es buena práctica tenerlo
export interface VentaPorHoraItem {
    hora: number;
    total_vendido: number;
    transacciones: number;
}

export interface ProductoOpcion {
    id_pro: number;
    codigo: string;
    nombre: string;
}