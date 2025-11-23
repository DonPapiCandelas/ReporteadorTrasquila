// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { KpiCard } from "../components/KpiCard";
import { VentasTable } from "../components/VentasTable";
import type {
    VentasProductoKpis,
    VentasProductoRow,
    VentasPorSucursal,
    ProductoOpcion,
} from "../types/reportes";
import {
    fetchKpis,
    fetchVentasPorSucursal as fetchVentasPorSucursalDashboard,
} from "../api/dashboard";
import {
    fetchVentasProductoRows,
    fetchSucursales,
    fetchProductos,
} from "../api/ventasProducto";

export const Dashboard: React.FC = () => {
    // --- estado de datos ---
    const [kpis, setKpis] = useState<VentasProductoKpis | null>(null);
    const [rows, setRows] = useState<VentasProductoRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTable, setLoadingTable] = useState(false); // Nuevo estado solo para la tabla
    const [error, setError] = useState<string | null>(null);

    // --- estado de paginación ---
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50); // Reducido a 50 por seguridad
    const [totalItems, setTotalItems] = useState(0);

    // --- estado de filtros ---
    const [sucursal, setSucursal] = useState<string>("");
    const [producto, setProducto] = useState<string>("");
    const [fechaDesde, setFechaDesde] = useState<string>("");
    const [fechaHasta, setFechaHasta] = useState<string>("");
    const [mes, setMes] = useState<string>("");
    const [anio, setAnio] = useState<string>("");

    // --- listas para combos ---
    const [sucursalesList, setSucursalesList] = useState<string[]>([]);
    const [productosList, setProductosList] = useState<ProductoOpcion[]>([]);

    // --- resumen mes actual por sucursal (dashboard bienvenida) ---
    const [sucursalesMesActual, setSucursalesMesActual] = useState<
        VentasPorSucursal[]
    >([]);

    const buildFilterParams = () => {
        const params: Record<string, any> = {};

        if (sucursal.trim() !== "") params.sucursal = sucursal.trim();
        if (producto.trim() !== "") params.producto = producto.trim();
        if (fechaDesde !== "") params.fecha_desde = fechaDesde;
        if (fechaHasta !== "") params.fecha_hasta = fechaHasta;

        if (mes !== "") {
            const mesNum = Number(mes);
            if (!Number.isNaN(mesNum)) params.mes = mesNum;
        }

        if (anio !== "") {
            const anioNum = Number(anio);
            if (!Number.isNaN(anioNum)) params.anio = anioNum;
        }

        return params;
    };

    // Carga KPI's (Rápido, solo totales)
    const cargarKPIs = async () => {
        try {
            const filtros = buildFilterParams();
            const kpisResp = await fetchKpis(filtros);
            setKpis(kpisResp);
        } catch (err) {
            console.error("Error cargando KPIs:", err);
        }
    };

    // Carga Tabla (Pesado, solo bajo demanda)
    const cargarTabla = async (page: number = 1) => {
        try {
            setLoadingTable(true);
            setError(null);
            const filtros = buildFilterParams();

            // IMPORTANTE: 'ejecutar: true' es la señal para que el backend busque los datos
            const rowsResp = await fetchVentasProductoRows({
                page: page,
                page_size: pageSize,
                ...filtros,
                // @ts-expect-error: Si tu interfaz TS no tiene 'ejecutar', ignoramos el error de TS por ahora
                ejecutar: true
            });

            setRows(rowsResp.items);
            setTotalItems(rowsResp.total_items);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
            setError("Error cargando tabla. Intenta filtros más específicos.");
        } finally {
            setLoadingTable(false);
        }
    };

    // Esta función se ejecuta al dar click en "Aplicar Filtros"
    const handleAplicarFiltros = () => {
        setCurrentPage(1);
        cargarKPIs();  // Recalcular KPIs con los nuevos filtros
        cargarTabla(1); // Ahora sí, traer los registros
    };

    const handleLimpiarFiltros = () => {
        setSucursal("");
        setProducto("");
        setFechaDesde("");
        setFechaHasta("");
        // Reseteamos al mes actual
        const currentDate = new Date();
        setMes(String(currentDate.getMonth() + 1));
        setAnio(String(currentDate.getFullYear()));

        setCurrentPage(1);
        setRows([]); // Limpiamos la tabla
        setTotalItems(0);

        // Recargamos KPIs iniciales solamente
        setTimeout(() => cargarKPIs(), 100);
    };

    // Carga inicial: SOLO Listas y KPIs del mes actual. 
    // NO cargamos la tabla aquí.
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                setError(null);

                const currentDate = new Date();
                const currentMonth = currentDate.getMonth() + 1;
                const currentYear = currentDate.getFullYear();

                // 1. Cargar Listas
                try {
                    const [sucursalesResp, productosResp] = await Promise.all([
                        fetchSucursales(),
                        fetchProductos()
                    ]);
                    setSucursalesList(sucursalesResp);
                    setProductosList(productosResp);
                } catch (e) { console.error("Error listas", e); }

                // 2. Cargar Resumen Dashboard (Gráfica de barras sucursales)
                try {
                    const resumenMes = await fetchVentasPorSucursalDashboard({ mes: currentMonth, anio: currentYear });
                    setSucursalesMesActual(resumenMes);
                } catch (e) { console.error("Error resumen", e); }

                // 3. Cargar KPIs Iniciales
                const filtrosIniciales = {
                    mes: currentMonth,
                    anio: currentYear,
                };
                try {
                    const kpisResp = await fetchKpis(filtrosIniciales);
                    setKpis(kpisResp);
                } catch (e) { console.error("Error KPIs", e); }

                // Setear filtros iniciales en los inputs
                setMes(String(currentMonth));
                setAnio(String(currentYear));

            } catch (err) {
                console.error("Error general inicio:", err);
                setError("Error de conexión inicial.");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const totalPages = Math.ceil(totalItems / pageSize);
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            cargarTabla(newPage);
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    return (
        <Layout>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
                gap: "1rem",
            }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>
                    Dashboard de Ventas
                </h1>
            </div>

            {/* Resumen mes actual por sucursal */}
            {!loading && sucursalesMesActual.length > 0 && (
                <div style={{
                    marginBottom: "1.5rem",
                    padding: "1.25rem",
                    background: "rgba(15, 23, 42, 0.5)",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                }}>
                    <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: 500 }}>
                        Venta Mes Actual por Sucursal
                    </h2>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "0.75rem",
                    }}
                    >
                        {sucursalesMesActual.map((s) => (
                            <KpiCard
                                key={s.sucursal ?? "SIN_SUCURSAL"}
                                label={s.sucursal ?? "Sin sucursal"}
                                value={`$${s.total_vendido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div style={{
                background: "rgba(15, 23, 42, 0.5)",
                padding: "1.25rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(148, 163, 184, 0.1)",
                marginBottom: "1.5rem",
            }}>
                <h2 style={{ fontSize: "1rem", marginBottom: "1rem", fontWeight: 500 }}>
                    Filtros
                </h2>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1rem",
                }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: "0.875rem" }}>Sucursal</label>
                        <select value={sucursal} onChange={(e) => setSucursal(e.target.value)} style={inputStyle}>
                            <option value="">Todas</option>
                            {sucursalesList.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: "0.875rem" }}>Producto</label>
                        <input type="text" list="productos-list" value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Código o nombre..." style={inputStyle} />
                        <datalist id="productos-list">
                            {productosList.map((p) => <option key={p.id_pro} value={`${p.codigo} - ${p.nombre}`} />)}
                        </datalist>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: "0.875rem" }}>Fecha Desde</label>
                        <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={inputStyle} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: "0.875rem" }}>Fecha Hasta</label>
                        <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={inputStyle} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: "0.875rem" }}>Mes</label>
                        <select value={mes} onChange={(e) => setMes(e.target.value)} style={inputStyle}>
                            <option value="">Todos</option>
                            <option value="1">Enero</option>
                            <option value="2">Febrero</option>
                            <option value="3">Marzo</option>
                            <option value="4">Abril</option>
                            <option value="5">Mayo</option>
                            <option value="6">Junio</option>
                            <option value="7">Julio</option>
                            <option value="8">Agosto</option>
                            <option value="9">Septiembre</option>
                            <option value="10">Octubre</option>
                            <option value="11">Noviembre</option>
                            <option value="12">Diciembre</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: "0.875rem" }}>Año</label>
                        <select value={anio} onChange={(e) => setAnio(e.target.value)} style={inputStyle}>
                            <option value="">Todos</option>
                            {years.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={handleAplicarFiltros} style={{ ...buttonStyle, background: "#22c55e" }}>
                        🔍 Buscar
                    </button>
                    <button onClick={handleLimpiarFiltros} style={{ ...buttonStyle, background: "#6b7280" }}>
                        🗑️ Limpiar
                    </button>
                </div>
            </div>

            {/* KPIs Dinámicos */}
            {kpis && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                }}
                >
                    <KpiCard label="Total Vendido" value={`$${kpis.total_vendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />
                    <KpiCard label="Unidades" value={kpis.unidades_vendidas.toLocaleString('es-MX')} />
                    <KpiCard label="Productos Únicos" value={kpis.productos_distintos.toLocaleString('es-MX')} />
                    <KpiCard label="Mejor Sucursal" value={kpis.sucursal_top ?? "—"} subtle={kpis.sucursal_top_total ? `$${kpis.sucursal_top_total.toLocaleString('es-MX')}` : ""} />
                </div>
            )}

            {/* Mensaje de carga o error */}
            {loadingTable && (
                <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                    🌀 Cargando registros...
                </div>
            )}

            {error && (
                <div style={{ padding: "1rem", background: "#7f1d1d", color: "#fecaca", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                    {error}
                </div>
            )}

            {/* Tabla */}
            {!loadingTable && rows.length > 0 && (
                <div style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    padding: "1.25rem",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                    overflowX: "auto",
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                        <h3>Registros ({totalItems})</h3>
                        <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>Página {currentPage} de {totalPages}</span>
                    </div>
                    <VentasTable rows={rows} />

                    {/* Paginación simple */}
                    {totalPages > 1 && (
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem" }}>
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={pagerBtnStyle}>Anterior</button>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} style={pagerBtnStyle}>Siguiente</button>
                        </div>
                    )}
                </div>
            )}

            {!loadingTable && rows.length === 0 && !loading && (
                <div style={{ textAlign: "center", padding: "3rem", opacity: 0.6 }}>
                    👆 Usa los filtros y presiona "Buscar" para ver el detalle.
                </div>
            )}
        </Layout>
    );
};

const inputStyle: React.CSSProperties = {
    padding: "0.625rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(148,163,184,0.3)",
    background: "rgba(2, 6, 23, 0.6)",
    color: "#e5e7eb",
    fontSize: "0.875rem",
};

const buttonStyle: React.CSSProperties = {
    border: "none",
    borderRadius: "0.5rem",
    padding: "0.6rem 1.25rem",
    fontSize: "0.9rem",
    cursor: "pointer",
    color: "#fff",
    fontWeight: 600,
};

const pagerBtnStyle: React.CSSProperties = {
    padding: "0.4rem 0.8rem",
    borderRadius: "0.3rem",
    border: "1px solid #475569",
    background: "transparent",
    color: "white",
    cursor: "pointer",
};

export default Dashboard;