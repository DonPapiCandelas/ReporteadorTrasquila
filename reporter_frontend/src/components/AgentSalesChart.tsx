import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { VentasPorAgenteItem } from '../types/tickets';

interface AgentSalesChartProps {
    data: VentasPorAgenteItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AgentSalesChart: React.FC<AgentSalesChartProps> = ({ data }) => {
    return (
        <div className="bg-surface p-4 rounded-lg shadow-sm border border-border h-[400px]">
            <h3 className="text-lg font-semibold text-text-main mb-4">Ventas por Agente</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--text-muted)" />
                    <YAxis
                        dataKey="agente"
                        type="category"
                        width={100}
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Venta Total']}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
