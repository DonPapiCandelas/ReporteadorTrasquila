import React from "react";

interface KpiCardProps {
    /** Etiqueta o título del KPI (ej. "Ventas Totales") */
    label: string;
    /** Valor numérico o texto a mostrar */
    value: string | number;
    /** Texto secundario opcional (ej. "+5% vs mes anterior") */
    subtle?: string;
    /** Estilo visual: 'simple' (fondo blanco) o 'solid' (fondo de color primario) */
    variant?: 'simple' | 'solid';
    /** Color base opcional si es sólida */
    trendColor?: string;
}

/**
 * Tarjeta para mostrar Indicadores Clave de Desempeño (KPIs).
 * 
 * Se utiliza en el Dashboard para mostrar métricas resumidas.
 */
export const KpiCard: React.FC<KpiCardProps> = ({
    label,
    value,
    subtle,
    variant = 'simple'
}) => {

    // Estilos base (Tailwind CSS)
    const baseClasses = "group relative flex flex-col justify-between overflow-hidden rounded-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md";

    // Estilos según la variante
    const variantClasses = variant === 'solid'
        ? "bg-primary text-white border-none" // Fondo Verde Fuerte, Texto Blanco
        : "bg-surface text-text-main border border-border hover:border-primary/50"; // Blanco normal

    // Color de la etiqueta pequeña
    const subtleClasses = variant === 'solid'
        ? "text-white/90 bg-white/20 border-white/20"
        : "text-success bg-success/10 border-success/20";

    return (
        <div className={`${baseClasses} ${variantClasses}`}>
            {/* Efecto de brillo superior solo en variante simple */}
            {variant === 'simple' && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            )}

            <div>
                <p className={`text-sm font-medium tracking-wide uppercase ${variant === 'solid' ? 'text-white/80' : 'text-text-muted'}`}>
                    {label}
                </p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight">
                    {value}
                </h3>
            </div>

            {subtle && (
                <div className="mt-4 flex items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${subtleClasses}`}>
                        {subtle}
                    </span>
                </div>
            )}
        </div>
    );
};