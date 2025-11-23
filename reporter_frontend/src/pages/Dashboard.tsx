import React, { useEffect, useState, useRef } from "react";
import { Layout } from "../components/Layout";
import { KpiCard } from "../components/KpiCard";
import { VentasTable } from "../components/VentasTable";
import "./Dashboard.css";

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
    fetchVentasExcel
} from "../api/ventasProducto";

export const Dashboard: React.FC = () => {
    const [kpis, setKpis] = useState<VentasProductoKpis | null>(null);
    const [rows, setRows] = useState<VentasProductoRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingTable, setLoadingTable] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);
    const [totalItems, setTotalItems] = useState(0);

    const [sucursal, setSucursal] = useState<string>("");
    const [producto, setProducto] = useState<string>("");
    const [fechaDesde, setFechaDesde] = useState<string>("");
    const [fechaHasta, setFechaHasta] = useState<string>("");
    const [mes, setMes] = useState<string>("");
    const [anio, setAnio] = useState<string>("");

    const [sucursalesList, setSucursalesList] = useState<string[]>([]);
    const [productosList, setProductosList] = useState<ProductoOpcion[]>([]);
    const [sucursalesMesActual, setSucursalesMesActual] = useState<VentasPorSucursal[]>([]);

    // --- REF PARA CANCELAR PETICIONES ---
    const abortControllerRef = useRef<AbortController | null>(null);

    const buildFilterParams = () => {
        const params: Record<string, any> = {};

        if (sucursal.trim() !== "") params.sucursal = sucursal.trim();

        // --- CORRECCIÓN AQUÍ ---
        if (producto.trim() !== "") {
            // Si el usuario seleccionó de la lista, el formato es "CODIGO - NOMBRE"
            // Intentamos separar para enviar solo el CÓDIGO, que es lo que SQL encontrará rápido.
            if (producto.includes(" - ")) {
                // Tomamos solo la parte antes del guion (el código)
                const soloCodigo = producto.split(" - ")[0];
                params.producto = soloCodigo.trim();
            } else {
                // Si el usuario escribió manualmente (ej: "TECATE"), enviamos todo
                params.producto = producto.trim();
            }
        }

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

    const cargarKPIs = async () => {
        try {
            const filtros = buildFilterParams();
            const kpisResp = await fetchKpis(filtros);
            setKpis(kpisResp);
        } catch (err) {
            console.error("Error cargando KPIs:", err);
        }
    };

    const cargarTabla = async (page: number = 1) => {
        // 1. Si hay una petición anterior corriendo, la cancelamos automáticante
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 2. Creamos un nuevo "interruptor"
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setLoadingTable(true);
            setError(null);
            const filtros = buildFilterParams();

            const rowsResp = await fetchVentasProductoRows({
                page: page,
                page_size: pageSize,
                ...filtros,
                // @ts-expect-error: Campo extra para el backend
                ejecutar: true
            }, controller.signal); // <--- PASAMOS LA SEÑAL

            setRows(rowsResp.items);
            setTotalItems(rowsResp.total_items);
            setCurrentPage(page);
        } catch (err: any) {
            // Si el error fue por cancelar, no mostramos mensaje rojo
            if (err.code === "ERR_CANCELED" || err.name === "CanceledError") {
                console.log("Petición cancelada por el usuario");
            } else {
                console.error(err);
                setError(err.message || "Error cargando tabla.");
            }
        } finally {
            // Solo quitamos el loading si NO fue cancelado para iniciar otra inmediatamente
            // (Pero como aquí es manual, está bien limpiarlo)
            if (abortControllerRef.current === controller) {
                setLoadingTable(false);
                abortControllerRef.current = null;
            }
        }
    };

    // --- FUNCIÓN DEL BOTÓN CANCELAR ---
    const handleCancelarCarga = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort(); // Corta el cable
            setLoadingTable(false); // Quita el spinner
            abortControllerRef.current = null;
        }
    };

    const handleExportExcel = async () => {
        try {
            setLoadingTable(true);
            const filtros = buildFilterParams();
            const blob = await fetchVentasExcel(filtros);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_Ventas_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error descargando Excel", error);
            alert("Error al generar el Excel.");
        } finally {
            setLoadingTable(false);
        }
    };

    const handleExportPDF = () => alert("En construcción 🚧");
    const handleExportHTML = () => alert("En construcción 🚧");

    const handleAplicarFiltros = () => {
        setCurrentPage(1);
        cargarKPIs();
        cargarTabla(1);
    };

    const handleLimpiarFiltros = () => {
        setSucursal("");
        setProducto("");
        setFechaDesde("");
        setFechaHasta("");
        const currentDate = new Date();
        setMes(String(currentDate.getMonth() + 1));
        setAnio(String(currentDate.getFullYear()));
        setCurrentPage(1);
        setRows([]);
        setTotalItems(0);
        setTimeout(() => cargarKPIs(), 100);
    };

    const totalPages = Math.ceil(totalItems / pageSize);
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            cargarTabla(newPage);
        }
    };

    // --- CARGA INICIAL ---
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                setError(null);

                const currentDate = new Date();
                const currentMonth = currentDate.getMonth() + 1;
                const currentYear = currentDate.getFullYear();

                // 1. Cargar Listas (Sucursales y Productos)
                try {
                    const [sucursalesResp, productosResp] = await Promise.all([
                        fetchSucursales(),
                        fetchProductos()
                    ]);
                    setSucursalesList(sucursalesResp);
                    setProductosList(productosResp);
                } catch (e) { console.error("Error listas", e); }

                // 2. Cargar Resumen Dashboard (Gráfica o Tarjetas Superiores)
                try {
                    // Pedimos datos del mes actual explícitamente para que no salga vacío
                    const resumenMes = await fetchVentasPorSucursalDashboard({ mes: currentMonth, anio: currentYear });
                    setSucursalesMesActual(resumenMes);
                } catch (e) { console.error("Error resumen", e); }

                // 3. Cargar KPIs Iniciales (Totales Generales)
                try {
                    // Igual, pedimos mes actual para dar un contexto inicial útil
                    const kpisResp = await fetchKpis({ mes: currentMonth, anio: currentYear });
                    setKpis(kpisResp);
                } catch (e) { console.error("Error KPIs", e); }

                // --- CAMBIO: YA NO PRE-LLENAMOS LOS FILTROS ---
                // Comentamos o borramos estas líneas para que los combos inicien en "Todos"
                // setMes(String(currentMonth)); 
                // setAnio(String(currentYear));

            } catch (err) {
                console.error("Error general inicio:", err);
                setError("Error de conexión inicial.");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

    // --- EFECTO: BÚSQUEDA DINÁMICA DE PRODUCTOS ---
    useEffect(() => {
        // Solo buscamos si hay algo escrito (al menos 2 letras)
        if (!producto || producto.length < 2) {
            return;
        }

        // Usamos un temporizador para no saturar al servidor cada vez que presionas una tecla
        const delayDebounceFn = setTimeout(async () => {
            try {
                console.log("Buscando productos:", producto);
                // Llamamos al backend con lo que escribiste
                const resultados = await fetchProductos(producto);
                setProductosList(resultados);
            } catch (error) {
                console.error("Error buscando productos", error);
            }
        }, 500); // Espera 500ms después de que dejes de escribir

        // Limpieza: Si sigues escribiendo, cancela el temporizador anterior
        return () => clearTimeout(delayDebounceFn);
    }, [producto]); // Se ejecuta cada vez que cambia el texto 'producto'

    return (
        <Layout>
            <div className="dashboard-header">
                <h1 className="dashboard-title">Dashboard de Ventas</h1>
            </div>

            {!loading && sucursalesMesActual.length > 0 && (
                <section className="panel-section">
                    <h2 className="panel-title">Venta Mes Actual por Sucursal</h2>
                    <div className="grid-kpis">
                        {sucursalesMesActual.map((s) => (
                            <KpiCard
                                key={s.sucursal ?? "SIN_SUCURSAL"}
                                label={s.sucursal ?? "Sin sucursal"}
                                value={`$${s.total_vendido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            />
                        ))}
                    </div>
                </section>
            )}

            <section className="panel-section">
                <h2 className="panel-title">Filtros</h2>
                <div className="grid-filters">
                    <div className="form-group">
                        <label className="form-label">Sucursal</label>
                        <select className="form-control" value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
                            <option value="">Todas</option>
                            {sucursalesList.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Producto</label>
                        <input className="form-control" type="text" list="productos-list" value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Código o nombre..." />
                        <datalist id="productos-list">
                            {productosList.map((p) => <option key={p.id_pro} value={`${p.codigo} - ${p.nombre}`} />)}
                        </datalist>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha Desde</label>
                        <input className="form-control" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha Hasta</label>
                        <input className="form-control" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mes</label>
                        <select className="form-control" value={mes} onChange={(e) => setMes(e.target.value)}>
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
                    <div className="form-group">
                        <label className="form-label">Año</label>
                        <select className="form-control" value={anio} onChange={(e) => setAnio(e.target.value)}>
                            <option value="">Todos</option>
                            {years.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                </div>

                <div className="action-bar">
                    <button className="btn btn-success" onClick={handleAplicarFiltros} disabled={loadingTable}>
                        {loadingTable ? "..." : "🔍 Buscar"}
                    </button>
                    <button className="btn btn-secondary" onClick={handleLimpiarFiltros}>
                        🗑️ Limpiar
                    </button>
                </div>
            </section>

            <div className="export-bar">
                <button className="btn btn-success" onClick={handleExportExcel} disabled={loadingTable}>
                    📊 Exportar Excel
                </button>
                <button className="btn btn-danger" onClick={handleExportPDF} disabled>
                    📄 Exportar PDF
                </button>
                <button className="btn btn-primary" onClick={handleExportHTML} disabled>
                    🌐 Exportar HTML
                </button>
            </div>

            {kpis && (
                <div className="grid-kpis kpi-resumen">
                    <KpiCard label="Total Vendido" value={`$${kpis.total_vendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />
                    <KpiCard label="Unidades" value={kpis.unidades_vendidas.toLocaleString('es-MX')} />
                    <KpiCard label="Productos Únicos" value={kpis.productos_distintos.toLocaleString('es-MX')} />
                    <KpiCard label="Mejor Sucursal" value={kpis.sucursal_top ?? "—"} subtle={kpis.sucursal_top_total ? `$${kpis.sucursal_top_total.toLocaleString('es-MX')}` : ""} />
                </div>
            )}

            {/* SECCIÓN DE CARGA CON BOTÓN CANCELAR */}
            {loadingTable && (
                <div className="msg-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <span>🌀 Cargando registros... esto puede tardar unos segundos.</span>
                    <button className="btn btn-danger" onClick={handleCancelarCarga}>
                        ⛔ Cancelar Petición
                    </button>
                </div>
            )}

            {error && <div className="msg-error">{error}</div>}

            {!loadingTable && rows.length > 0 && (
                <section className="panel-section compact">
                    <div className="table-header">
                        <h3 className="table-title">Registros ({totalItems})</h3>
                        <span className="page-info">Página {currentPage} de {totalPages}</span>
                    </div>
                    <VentasTable rows={rows} />
                    {totalPages > 1 && (
                        <div className="paginator">
                            <button className="btn-pager" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Anterior</button>
                            <button className="btn-pager" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente</button>
                        </div>
                    )}
                </section>
            )}

            {!loadingTable && rows.length === 0 && !loading && (
                <div className="msg-loading">
                    👆 Usa los filtros y presiona "Buscar" para ver el detalle.
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;