// src/api/ventasProducto.ts
import { apiClient } from "./client";
import type { VentasProductoPage, ProductoOpcion } from "../types/reportes";

export interface VentasProductoQuery {
    page?: number;
    page_size?: number;
    sucursal?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    mes?: number;
    producto?: string;
    anio?: number;
    ejecutar?: boolean;
}

// --- CAMBIO AQUÍ: Agregamos 'signal' ---
export async function fetchVentasProductoRows(params?: VentasProductoQuery, signal?: AbortSignal) {
    const res = await apiClient.get<VentasProductoPage>(
        "/api/v1/ventas-producto/rows",
        {
            params,
            signal // <--- Pasamos la señal a axios
        }
    );
    return res.data;
}

// ... (resto de funciones: fetchSucursales, fetchProductos, fetchVentasExcel siguen igual)
export async function fetchSucursales() {
    const res = await apiClient.get<string[]>(
        "/api/v1/ventas-producto/sucursales"
    );
    return res.data;
}

export async function fetchProductos(q?: string) {
    const res = await apiClient.get<ProductoOpcion[]>(
        "/api/v1/ventas-producto/productos",
        { params: q ? { q } : {} }
    );
    return res.data;
}

export async function fetchVentasExcel(params?: Record<string, unknown>) {
    const res = await apiClient.get(
        "/api/v1/ventas-producto/export/excel",
        {
            params,
            responseType: 'blob'
        }
    );
    return res.data;
}