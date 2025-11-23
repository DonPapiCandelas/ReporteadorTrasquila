import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { Layout } from "../components/Layout";
import { KpiCard } from "../components/KpiCard";
import { VentasTable } from "../components/VentasTable";
import { HourlyChart } from "../components/HourlyChart";
import { TopProductsList } from "../components/TopProductsList";

import type {
    VentasProductoKpis,
    VentasProductoRow,
    TopProducto,
    VentasPorSucursal,
    ProductoOpcion,
} from "../types/reportes";

import {
    fetchKpis,
    fetchHorasPico,
    fetchTopProductos,
    fetchVentasPorSucursal
} from "../api/dashboard";

import {
    fetchVentasProductoRows,
    fetchSucursales,
    fetchProductos,
    fetchVentasExcel
} from "../api/ventasProducto";

export const Dashboard: React.FC = () => {
    const [activeView, setActiveView] = useState<'dashboard' | 'details'>('dashboard');

    // --- ESTADOS DE DATOS ---
    const [kpis, setKpis] = useState<VentasProductoKpis | null>(null);
    const [kpisDetalle, setKpisDetalle] = useState<VentasProductoKpis | null>(null);

    const [horasPico, setHorasPico] = useState<any[]>([]);
    const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
    const [sucursalesMesActual, setSucursalesMesActual] = useState<VentasPorSucursal[]>([]);
    const [rows, setRows] = useState<VentasProductoRow[]>([]);

    const [loadingTable, setLoadingTable] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);
    // Esta variable es necesaria para que funcione la paginación en la vista "Detalles"
    const [totalItems, setTotalItems] = useState(0);

    // Filtros
    const currentDate = new Date();
    const [sucursal, setSucursal] = useState<string>("");
    const [producto, setProducto] = useState<string>("");
    const [fechaDesde, setFechaDesde] = useState<string>("");
    const [fechaHasta, setFechaHasta] = useState<string>("");

    const [mes, setMes] = useState<string>(String(currentDate.getMonth() + 1));
    const [anio, setAnio] = useState<string>(String(currentDate.getFullYear()));

    const [sucursalesList, setSucursalesList] = useState<string[]>([]);
    const [productosList, setProductosList] = useState<ProductoOpcion[]>([]);

    const abortControllerRef = useRef<AbortController | null>(null);
    const dashboardRef = useRef<HTMLDivElement>(null);

    // --- LÓGICA DE FILTROS ---
    const buildFilterParams = (isDashboard: boolean) => {
        const params: Record<string, any> = {};

        if (sucursal.trim() !== "") params.sucursal = sucursal.trim();

        const hayFechasExactas = fechaDesde !== "" || fechaHasta !== "";

        if (isDashboard) {
            // Dashboard siempre usa Mes/Año
            if (mes !== "") params.mes = Number(mes);
            if (anio !== "") params.anio = Number(anio);
        } else {
            // Detalles: Si hay fechas exactas, úsalas. Si no, usa Mes/Año.
            if (hayFechasExactas) {
                if (fechaDesde !== "") params.fecha_desde = fechaDesde;
                if (fechaHasta !== "") params.fecha_hasta = fechaHasta;
            } else {
                if (mes !== "") params.mes = Number(mes);
                if (anio !== "") params.anio = Number(anio);
            }

            if (producto.trim() !== "") {
                if (producto.includes(" - ")) params.producto = producto.split(" - ")[0].trim();
                else params.producto = producto.trim();
            }
        }

        return params;
    };

    // --- CARGAS DE DATOS ---
    const cargarDatosDashboard = async () => {
        try {
            const filtros = buildFilterParams(true);
            const [kpisResp, horasResp, topResp, sucsResp] = await Promise.all([
                fetchKpis(filtros),
                fetchHorasPico(filtros),
                fetchTopProductos(filtros),
                fetchVentasPorSucursal(filtros)
            ]);
            setKpis(kpisResp);
            setHorasPico(horasResp);
            setTopProductos(topResp);
            setSucursalesMesActual(sucsResp);
        } catch (err) { console.error(err); }
    };

    const cargarDetalles = async (page: number = 1) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setLoadingTable(true);
            const filtros = buildFilterParams(false);

            const [rowsResp, kpisResp] = await Promise.all([
                fetchVentasProductoRows({
                    page,
                    page_size: pageSize,
                    ...filtros,
                    ejecutar: true
                }, controller.signal),
                fetchKpis(filtros)
            ]);

            setRows(rowsResp.items);
            setTotalItems(rowsResp.total_items); // <--- Aquí se usa
            setKpisDetalle(kpisResp);
            setCurrentPage(page);
        } catch (err: any) {
            if (err.code !== "ERR_CANCELED") console.error(err);
        } finally {
            if (abortControllerRef.current === controller) setLoadingTable(false);
        }
    };

    // --- EXPORTAR EXCEL ---
    const handleExportExcel = async () => {
        try {
            setLoadingTable(true);
            const filtros = buildFilterParams(false);
            const blob = await fetchVentasExcel(filtros);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_Detallado_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error Excel", error);
            alert("Error al generar Excel.");
        } finally {
            setLoadingTable(false);
        }
    };

    // --- EXPORTAR PDF ---
    const handleExportPDF = async () => {
        if (!dashboardRef.current) return;
        setExportingPdf(true);
        try {
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const dashboard = clonedDoc.getElementById('dashboard-content');
                    const grid = clonedDoc.getElementById('charts-grid');
                    const scrollList = clonedDoc.getElementById('top-products-scroll');

                    if (dashboard) {
                        dashboard.style.backgroundColor = '#ffffff';
                        dashboard.style.color = '#0f172a';
                    }
                    const allTextElements = clonedDoc.querySelectorAll('h1, h2, h3, p, span, div, label, td, th');
                    allTextElements.forEach((el) => {
                        if (el instanceof HTMLElement) {
                            el.style.color = '#000000';
                            el.style.textShadow = 'none';
                            el.style.opacity = '1';
                            const style = window.getComputedStyle(el);
                            if (style.borderWidth !== '0px') el.style.borderColor = '#94a3b8';
                        }
                    });
                    const cards = clonedDoc.querySelectorAll('.bg-surface, .bg-background');
                    cards.forEach((el) => {
                        if (el instanceof HTMLElement) {
                            el.style.backgroundColor = '#ffffff';
                            el.style.border = '1px solid #e2e8f0';
                        }
                    });

                    if (grid) { grid.style.height = 'auto'; grid.style.display = 'block'; }
                    if (scrollList) { scrollList.style.overflow = 'visible'; scrollList.style.height = 'auto'; scrollList.style.maxHeight = 'none'; }
                    const buttons = clonedDoc.querySelectorAll('button');
                    buttons.forEach(btn => btn.style.display = 'none');
                }
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            pdf.save(`Reporte_Trasquila_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) { console.error(error); alert("Error PDF"); }
        finally { setExportingPdf(false); }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [sucs, prods] = await Promise.all([fetchSucursales(), fetchProductos()]);
                setSucursalesList(sucs);
                setProductosList(prods);
                await cargarDatosDashboard();
            } catch (e) { console.error(e); }
        };
        init();
    }, []);

    const handleAplicarFiltros = () => {
        if (activeView === 'dashboard') cargarDatosDashboard();
        else cargarDetalles(1);
    };

    const handleLimpiarFiltros = () => {
        setSucursal("");
        setProducto("");
        setFechaDesde("");
        setFechaHasta("");
        setMes(String(new Date().getMonth() + 1));
        setAnio(String(new Date().getFullYear()));
        if (activeView === 'details') {
            setRows([]);
            setKpisDetalle(null);
        } else {
            cargarDatosDashboard();
        }
    };

    // Paginación
    const totalPages = Math.ceil(totalItems / pageSize);
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            cargarDetalles(newPage);
        }
    };

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    return (
        <Layout>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-main">
                        {activeView === 'dashboard' ? 'Dashboard Ejecutivo' : 'Explorador de Ventas'}
                    </h1>
                    <p className="text-sm text-text-muted mt-1">
                        {activeView === 'dashboard' ? 'Resumen global mensual' : 'Consulta detallada por producto y fecha'}
                    </p>
                </div>

                <div className="flex gap-3">
                    {activeView === 'dashboard' && (
                        <button onClick={handleExportPDF} disabled={exportingPdf} className="btn btn-secondary text-xs">
                            {exportingPdf ? "Generando..." : "📄 Descargar PDF"}
                        </button>
                    )}
                    <div className="flex rounded-lg bg-surface p-1 border border-border">
                        <button onClick={() => setActiveView('dashboard')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === 'dashboard' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>📊 Resumen</button>
                        <button onClick={() => setActiveView('details')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === 'details' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>📋 Detalles</button>
                    </div>
                </div>
            </div>

            {/* --- BARRA DE FILTROS --- */}
            <div className="mb-6 rounded-xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-48">
                        <label className="mb-1 block text-xs font-medium text-text-muted">Sucursal</label>
                        <select className="form-control" value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
                            <option value="">Todas las Sucursales</option>
                            {sucursalesList.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {activeView === 'dashboard' ? (
                        <>
                            <div className="w-32">
                                <label className="mb-1 block text-xs font-medium text-text-muted">Mes</label>
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
                            <div className="w-24">
                                <label className="mb-1 block text-xs font-medium text-text-muted">Año</label>
                                <select className="form-control" value={anio} onChange={(e) => setAnio(e.target.value)}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-36">
                                <label className="mb-1 block text-xs font-medium text-text-muted">Fecha Desde</label>
                                <input type="date" className="form-control" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                            </div>
                            <div className="w-36">
                                <label className="mb-1 block text-xs font-medium text-text-muted">Fecha Hasta</label>
                                <input type="date" className="form-control" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                            </div>
                            <div className="flex-1 min-w-[200px]">
                                <label className="mb-1 block text-xs font-medium text-text-muted">Producto</label>
                                <input className="form-control" placeholder="Código o Nombre..." value={producto} onChange={e => setProducto(e.target.value)} list="prods" />
                                <datalist id="prods">{productosList.map(p => <option key={p.id_pro} value={`${p.codigo} - ${p.nombre}`} />)}</datalist>
                            </div>
                        </>
                    )}

                    <div className="flex gap-2">
                        <button className="btn btn-primary h-[38px] px-6" onClick={handleAplicarFiltros} disabled={loadingTable}>
                            {loadingTable ? "..." : "Buscar"}
                        </button>
                        <button className="btn btn-secondary h-[38px] px-3" onClick={handleLimpiarFiltros} title="Limpiar filtros">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>

            {/* VISTA DASHBOARD */}
            {activeView === 'dashboard' && (
                <div ref={dashboardRef} id="dashboard-content" className="animate-fade-in space-y-8 bg-background p-4 rounded-xl">
                    {sucursalesMesActual.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-bold text-text-main">Venta Mensual por Sucursal</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Tiempo Real</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {sucursalesMesActual.map((s) => (
                                    <KpiCard
                                        key={s.sucursal ?? "SIN"}
                                        label={s.sucursal ?? "Sin sucursal"}
                                        value={`$${s.total_vendido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        variant="simple"
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                    <hr className="border-border opacity-50" />
                    {kpis && (
                        <section>
                            <h3 className="text-lg font-bold text-text-main mb-4">Métricas Globales</h3>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                <KpiCard label="Venta Total Global" value={`$${kpis.total_vendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} variant="solid" />
                                <KpiCard label="Ticket Promedio" value={`$${kpis.ticket_promedio?.toLocaleString('es-MX', { maximumFractionDigits: 2 }) ?? '0.00'}`} subtle="Por transacción" />
                                <KpiCard label="Transacciones" value={Math.round(kpis.total_vendido / (kpis.ticket_promedio || 1)).toLocaleString()} />
                                <KpiCard label="Sucursal Líder" value={kpis.sucursal_top ?? "—"} subtle={kpis.sucursal_top_total ? `$${kpis.sucursal_top_total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}` : ""} />
                            </div>
                        </section>
                    )}
                    <div id="charts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                        <div className="lg:col-span-2 h-full">
                            {horasPico.length > 0 ? <HourlyChart data={horasPico} /> : <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl text-text-muted">Sin datos de horarios</div>}
                        </div>
                        <div className="h-full">
                            {topProductos.length > 0 ? <TopProductsList data={topProductos} sucursalNombre={sucursal} /> : <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl text-text-muted">Sin datos Top</div>}
                        </div>
                    </div>
                    <div className="mt-8 text-center text-xs text-text-muted opacity-50">Generado por TrasquilaBI · {new Date().toLocaleDateString()}</div>
                </div>
            )}

            {/* VISTA DETALLES */}
            {activeView === 'details' && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-text-main">Resultados de Búsqueda</h3>
                        <button onClick={handleExportExcel} disabled={loadingTable || rows.length === 0} className="btn btn-success text-white">
                            📊 Exportar Excel
                        </button>
                    </div>

                    {kpisDetalle && (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-surface p-4 rounded-xl border border-border shadow-sm">
                            <div className="text-center border-r border-border last:border-0">
                                <p className="text-xs text-text-muted uppercase tracking-wider">Total Vendido</p>
                                <p className="text-xl font-bold text-primary">${kpisDetalle.total_vendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-center border-r border-border last:border-0">
                                <p className="text-xs text-text-muted uppercase tracking-wider">Unidades</p>
                                <p className="text-xl font-bold text-text-main">{kpisDetalle.unidades_vendidas.toLocaleString('es-MX')}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-text-muted uppercase tracking-wider">Tickets</p>
                                <p className="text-xl font-bold text-text-main">{Math.round(kpisDetalle.total_vendido / (kpisDetalle.ticket_promedio || 1)).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {rows.length === 0 && !loadingTable ? (
                        <div className="text-center py-10 text-text-muted border border-dashed border-border rounded-xl bg-surface">
                            <div className="text-4xl mb-2">📋</div>
                            <p>Usa los filtros y presiona "Buscar" para ver el detalle.</p>
                        </div>
                    ) : (
                        <>
                            <VentasTable rows={rows} />
                            {/* Paginador Simple */}
                            <div className="flex justify-center gap-2 mt-4">
                                <button className="btn btn-secondary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Anterior</button>
                                <span className="flex items-center text-sm text-text-muted">Pág {currentPage} de {totalPages}</span>
                                <button className="btn btn-secondary" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default Dashboard;