import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import type { VentaPagoPorDia } from "../types/reportes";

interface Props {
    data: VentaPagoPorDia[];
}

export const PaymentMethodsChart: React.FC<Props> = ({ data }) => {
    // Ordenar por fecha por si acaso
    const formattedData = [...data].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map(d => ({
        ...d,
        fechaLabel: new Date(d.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    }));

    return (
        <div className="h-[400px] w-full bg-surface rounded-xl p-4 border border-border shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-text-main">Evolución de Formas de Pago</h3>
                <p className="text-xs text-text-muted">Desglose diario por tipo de pago</p>
            </div>

            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                    <XAxis
                        dataKey="fechaLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--bg-background)', opacity: 0.4 }}
                        contentStyle={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="total_efectivo" name="Efectivo" stackId="a" fill="#10b981" />
                    <Bar dataKey="total_tarjeta" name="Tarjeta" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="total_vales" name="Vales" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="total_transferencia" name="Transferencia" stackId="a" fill="#8b5cf6" />
                    <Bar dataKey="total_otro" name="Otro" stackId="a" fill="#64748b" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
