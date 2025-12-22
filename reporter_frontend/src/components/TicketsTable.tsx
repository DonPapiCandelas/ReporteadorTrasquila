import React from 'react';
import type { TicketRow } from '../types/tickets';

interface TicketsTableProps {
    tickets: TicketRow[];
    loading: boolean;
}

export const TicketsTable: React.FC<TicketsTableProps> = ({ tickets, loading }) => {
    if (loading) {
        return <div className="p-8 text-center text-text-muted">Cargando tickets...</div>;
    }

    if (tickets.length === 0) {
        return <div className="p-8 text-center text-text-muted">No se encontraron tickets con los filtros seleccionados.</div>;
    }

    return (
        <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-border bg-surface">
                <thead className="bg-gray-50 dark:bg-white/5">
                    <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Folio</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Fecha/Hora</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Sucursal</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Agente</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Total</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Efectivo</th>
                        <th className="px-3 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Tarjeta</th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {tickets.map((ticket) => (
                        <tr key={ticket.id_venta} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${ticket.cancelado === 'cancelado' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                            <td className="px-3 py-2 text-sm text-text-main font-medium">{ticket.serie} {ticket.folio}</td>
                            <td className="px-3 py-2 text-sm text-text-muted">
                                {ticket.fecha}<br />
                                <span className="text-xs">{ticket.hora}</span>
                            </td>
                            <td className="px-3 py-2 text-sm text-text-muted">{ticket.CNOMBREALMACEN}</td>
                            <td className="px-3 py-2 text-sm text-text-muted">{ticket.CNOMBREAGENTE || '-'}</td>
                            <td className="px-3 py-2 text-sm text-text-main text-right font-bold">
                                ${ticket.total.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-sm text-text-muted text-right">
                                {ticket.fEfectivo > 0 ? `$${ticket.fEfectivo.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-sm text-text-muted text-right">
                                {ticket.Tarjeta > 0 ? `$${ticket.Tarjeta.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-sm text-center">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${ticket.cancelado === 'cobrado'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {ticket.cancelado === 'cobrado' ? 'Cobrado' : 'Cancelado'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
