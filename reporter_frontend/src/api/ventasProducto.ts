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
}

export async function fetchVentasProductoRows(params?: VentasProductoQuery) {
    const res = await apiClient.get<VentasProductoPage>(
        "/api/v1/ventas-producto/rows",
        { params }
    );
    return res.data;
}

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
