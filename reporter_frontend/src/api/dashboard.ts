// src/api/dashboard.ts
import { apiClient } from "./client";
import type {
    VentasProductoKpis,
    TopProducto,
    VentasPorSucursal,
    PuntoTimeline,
} from "../types/reportes";

export async function fetchKpis(params?: Record<string, unknown>) {
    const res = await apiClient.get<VentasProductoKpis>(
        "/api/v1/dashboard/kpis",
        { params }
    );
    return res.data;
}

export async function fetchTopProductos(params?: Record<string, unknown>) {
    const res = await apiClient.get<TopProducto[]>(
        "/api/v1/dashboard/top-productos",
        { params }
    );
    return res.data;
}

export async function fetchVentasPorSucursal(params?: Record<string, unknown>) {
    const res = await apiClient.get<VentasPorSucursal[]>(
        "/api/v1/dashboard/ventas-por-sucursal",
        { params }
    );
    return res.data;
}

export async function fetchTimeline(params?: Record<string, unknown>) {
    const res = await apiClient.get<PuntoTimeline[]>(
        "/api/v1/dashboard/timeline",
        { params }
    );
    return res.data;
}
