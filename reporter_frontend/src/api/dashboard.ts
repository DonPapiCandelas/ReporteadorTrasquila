// src/api/dashboard.ts
import { apiClient } from "./client";
import type {
    VentasProductoKpis,
    TopProducto,
    VentasPorSucursal,
    VentaPagoPorDia,
    // Puedes importar VentaPorHoraItem si lo definiste en types, si no usa any
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

// --- ESTA ES LA QUE FALTABA ---
export async function fetchHorasPico(params?: Record<string, unknown>) {
    const res = await apiClient.get<any[]>(
        "/api/v1/dashboard/horas-pico",
        { params }
    );
    return res.data;
}

export async function fetchVentasPagoPorDia(params?: Record<string, unknown>) {
    const res = await apiClient.get<VentaPagoPorDia[]>(
        "/api/v1/dashboard/pagos-por-dia",
        { params }
    );
    return res.data;
}