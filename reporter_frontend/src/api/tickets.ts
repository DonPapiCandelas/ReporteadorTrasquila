import { apiClient } from './client';
import type { TicketsResponse, VentasPorAgenteItem } from '../types/tickets';

export const fetchTickets = async (params: any): Promise<TicketsResponse> => {
    const response = await apiClient.get<TicketsResponse>('/api/v1/tickets/', { params });
    return response.data;
};

export const fetchVentasAgentes = async (params: any): Promise<VentasPorAgenteItem[]> => {
    const response = await apiClient.get<VentasPorAgenteItem[]>('/api/v1/tickets/agentes', { params });
    return response.data;
};
