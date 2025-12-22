import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { TicketFilters } from '../components/TicketFilters';
import { TicketsTable } from '../components/TicketsTable';
import { AgentSalesChart } from '../components/AgentSalesChart';
import { fetchTickets, fetchVentasAgentes } from '../api/tickets';
import { fetchSucursales } from '../api/ventasProducto';
import type { TicketRow, TicketKpis, VentasPorAgenteItem } from '../types/tickets';
import { KpiCard } from '../components/KpiCard';

export const TicketAnalysis: React.FC = () => {
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [kpis, setKpis] = useState<TicketKpis | null>(null);
    const [agentesData, setAgentesData] = useState<VentasPorAgenteItem[]>([]);
    const [sucursales, setSucursales] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    // Filtros actuales
    const [filters, setFilters] = useState<any>({});

    useEffect(() => {
        const loadSucursales = async () => {
            try {
                const data = await fetchSucursales();
                setSucursales(data);
            } catch (err) {
                console.error("Error loading sucursales", err);
            }
        };
        loadSucursales();
    }, []);

    const loadData = async (currentFilters: any) => {
        setLoading(true);
        try {
            // Cargar Tickets y KPIs
            const ticketsResponse = await fetchTickets({ ...currentFilters, page: 1, page_size: 100 });
            setTickets(ticketsResponse.data);
            setKpis(ticketsResponse.kpis);

            // Cargar Agentes
            const agentesResponse = await fetchVentasAgentes(currentFilters);
            setAgentesData(agentesResponse);

        } catch (error) {
            console.error("Error loading tickets data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters: any) => {
        setFilters(newFilters);
        loadData(newFilters);
    };

    return (
        <Layout>
            <div className="space-y-6 pb-8">
                <h1 className="text-2xl font-bold text-text-main">Análisis de Tickets</h1>

                <TicketFilters onFilterChange={handleFilterChange} sucursales={sucursales} />

                {/* KPIs */}
                {kpis && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                        <KpiCard label="Venta Total" value={`$${kpis.total_vendido.toLocaleString()}`} />
                        <KpiCard label="Total Tickets" value={kpis.total_tickets.toLocaleString()} />
                        <KpiCard label="Ticket Promedio" value={`$${kpis.promedio_ticket.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                        <KpiCard label="Cancelados" value={kpis.total_cancelados.toLocaleString()} variant="danger" />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Tabla ocupa 2 columnas */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-semibold text-text-main">Detalle de Tickets</h2>
                        <TicketsTable tickets={tickets} loading={loading} />
                    </div>

                    {/* Grafica ocupa 1 columna */}
                    <div className="space-y-4">
                        <AgentSalesChart data={agentesData} />
                    </div>
                </div>
            </div>
        </Layout>
    );
};
