export interface TicketRow {
    id_venta: number;
    CNOMBREAGENTE: string;
    serie: string | null;
    folio: number;
    fecha: string;
    hora: string;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
    fEfectivo: number;
    Tarjeta: number;
    fVales: number;
    fTrans: number;
    fOtro: number;
    fechaCancelado: string | null;
    cancelado: 'cobrado' | 'cancelado';
    CNOMBREALMACEN: string;
}

export interface TicketKpis {
    total_vendido: number;
    total_tickets: number;
    total_cancelados: number;
    promedio_ticket: number;
}

export interface TicketsResponse {
    data: TicketRow[];
    total: number;
    page: number;
    size: number;
    kpis: TicketKpis;
}

export interface VentasPorAgenteItem {
    agente: string;
    total: number;
    cantidad_tickets: number;
}
