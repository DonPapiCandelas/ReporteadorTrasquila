import React, { useState, useEffect } from 'react';

// Helpers para semanas
const getWeekRange = (week: number, year: number) => {
    // Calculo simple de ISO Week
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

    // Ajuste simple: Lunes a Domingo
    const monday = new Date(ISOweekStart);
    const sunday = new Date(ISOweekStart);
    sunday.setDate(monday.getDate() + 6);

    return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
    };
};

interface TicketFiltersProps {
    onFilterChange: (filters: any) => void;
    sucursales: string[]; // Si queremos lista dinámica, o input texto
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({ onFilterChange, sucursales }) => {
    const [mode, setMode] = useState<'range' | 'month' | 'week'>('month');
    const [sucursal, setSucursal] = useState('');

    // State filtros
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [semana, setSemana] = useState(1);

    // Initial load? No, wait for user.
    // useEffect(() => { applyFilters(); }, ...); // REMOVED

    const handleBuscar = () => {
        const filters: any = {};
        if (sucursal) filters.sucursal = sucursal;

        if (mode === 'range') {
            if (fechaInicio) filters.fecha_inicio = fechaInicio;
            if (fechaFin) filters.fecha_fin = fechaFin;
        } else if (mode === 'month') {
            filters.mes = mes;
            filters.anio = anio;
        } else if (mode === 'week') {
            filters.semana = semana;
            filters.anio = anio;
        }
        onFilterChange(filters);
    };

    return (
        <div className="bg-surface p-6 rounded-xl border border-border flex flex-col md:flex-row flex-wrap gap-4 items-end shadow-sm">
            {/* Sucursal */}
            <div className="flex flex-col w-full md:w-auto">
                <label className="text-xs font-medium text-text-muted mb-1">Sucursal</label>
                <select
                    className="form-control w-full md:w-48"
                    value={sucursal}
                    onChange={e => setSucursal(e.target.value)}
                >
                    <option value="">Todas</option>
                    {sucursales.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            {/* Modo Filtro */}
            <div className="flex flex-col w-full md:w-auto">
                <label className="text-xs font-medium text-text-muted mb-1">Tipo de Filtro</label>
                <select
                    className="form-control w-full md:w-40"
                    value={mode}
                    onChange={(e: any) => setMode(e.target.value)}
                >
                    <option value="range">Rango Fechas</option>
                    <option value="month">Mes Completo</option>
                    <option value="week">Semana</option>
                </select>
            </div>

            {/* Controls Dinámicos */}
            {mode === 'range' && (
                <>
                    <div className="flex flex-col w-1/2 md:w-auto">
                        <label className="text-xs font-medium text-text-muted mb-1">Desde</label>
                        <input type="date" className="form-control"
                            value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                    </div>
                    <div className="flex flex-col w-1/2 md:w-auto">
                        <label className="text-xs font-medium text-text-muted mb-1">Hasta</label>
                        <input type="date" className="form-control"
                            value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                    </div>
                </>
            )}

            {mode === 'month' && (
                <>
                    <div className="flex flex-col w-1/2 md:w-auto">
                        <label className="text-xs font-medium text-text-muted mb-1">Mes</label>
                        <select className="form-control w-full md:w-40"
                            value={mes} onChange={e => setMes(Number(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col w-1/2 md:w-auto">
                        <label className="text-xs font-medium text-text-muted mb-1">Año</label>
                        <input type="number" className="form-control w-full md:w-24"
                            value={anio} onChange={e => setAnio(Number(e.target.value))} />
                    </div>
                </>
            )}

            {mode === 'week' && (
                <>
                    <div className="flex flex-col w-1/2 md:w-auto">
                        <label className="text-xs font-medium text-text-muted mb-1">No. Semana</label>
                        <input type="number" min="1" max="53" className="form-control w-full md:w-24"
                            value={semana} onChange={e => setSemana(Number(e.target.value))} />
                    </div>
                    <div className="flex flex-col w-1/2 md:w-auto">
                        <label className="text-xs font-medium text-text-muted mb-1">Año</label>
                        <input type="number" className="form-control w-full md:w-24"
                            value={anio} onChange={e => setAnio(Number(e.target.value))} />
                    </div>
                    <div className="text-xs text-text-muted pb-2 w-full md:w-auto">
                        {(() => {
                            const { start, end } = getWeekRange(semana, anio);
                            return <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-white/10 rounded">{start} al {end}</span>;
                        })()}
                    </div>
                </>
            )}

            {/* Botón Buscar */}
            <div className="flex-1 md:flex-none">
                <button
                    onClick={handleBuscar}
                    className="btn btn-primary w-full md:w-auto h-[38px] px-6 flex items-center justify-center gap-2"
                >
                    <span>🔍</span> Buscar
                </button>
            </div>
        </div>
    );
};
