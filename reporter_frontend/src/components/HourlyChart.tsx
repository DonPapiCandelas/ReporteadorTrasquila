import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

interface HourlyData {
    /** Hora del día (0-23) */
    hora: number;
    /** Monto total vendido en esa hora */
    total_vendido: number;
    /** Número de transacciones realizadas */
    transacciones: number;
}

interface Props {
    /** Array de datos de ventas por hora */
    data: HourlyData[];
}

/**
 * Componente de gráfico de barras que muestra el flujo de ventas por hora.
 * Utiliza Recharts para visualizar los datos.
 * 
 * @param {Props} props - Propiedades del componente
 * @returns {JSX.Element} Gráfico de barras renderizado
 */
export const HourlyChart: React.FC<Props> = ({ data }) => {
    const formattedData = data.map(d => ({
        ...d,
        horaLabel: `${d.hora}:00`
    }));

    const maxVal = Math.max(...formattedData.map(d => d.total_vendido));

    return (
        <div className="h-[350px] w-full bg-surface rounded-xl p-4 border border-border shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-text-main">Flujo de Ventas por Hora</h3>
                <p className="text-xs text-text-muted">Comportamiento de la venta durante el día</p>
            </div>

            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={formattedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                    <XAxis
                        dataKey="horaLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <Tooltip
                        cursor={{ fill: 'var(--bg-background)', opacity: 0.4 }}
                        contentStyle={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Venta']}
                    />
                    <Bar dataKey="total_vendido" radius={[4, 4, 0, 0]}>
                        {formattedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.total_vendido === maxVal ? 'var(--color-primary)' : '#cbd5e1'}
                                fillOpacity={entry.total_vendido === maxVal ? 1 : 0.5}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};