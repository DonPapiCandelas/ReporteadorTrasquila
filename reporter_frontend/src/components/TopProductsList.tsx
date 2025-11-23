import React from "react";

interface ProductData {
    /** Código único del producto */
    codigo: string;
    /** Nombre o descripción del producto */
    producto: string;
    /** Monto total vendido del producto */
    total_vendido: number;
    /** Cantidad de unidades vendidas */
    cantidad_vendida: number;
}

interface Props {
    /** Lista de productos a mostrar en el ranking */
    data: ProductData[];
    /** Nombre de la sucursal (opcional) para el título */
    sucursalNombre?: string;
}

/**
 * Componente que muestra una lista de los productos más vendidos.
 * Incluye una barra de progreso visual para comparar ventas relativas.
 * 
 * @param {Props} props - Propiedades del componente
 * @returns {JSX.Element} Lista de productos renderizada
 */
export const TopProductsList: React.FC<Props> = ({ data, sucursalNombre }) => {
    const maxVal = data.length > 0 ? data[0].total_vendido : 0;

    const tituloContexto = sucursalNombre && sucursalNombre !== ""
        ? `En ${sucursalNombre}`
        : "Ranking Global";

    return (
        <div className="h-full w-full bg-surface rounded-xl p-5 border border-border shadow-sm flex flex-col">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-text-main">Top 10 Productos</h3>
                    <p className="text-xs text-primary font-medium uppercase tracking-wider">
                        {tituloContexto}
                    </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                    🏆
                </div>
            </div>

            <div id="top-products-scroll" className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {data.map((item, idx) => (
                    <div key={item.codigo} className="group relative">
                        <div className="flex justify-between text-sm mb-1 relative z-10">
                            <span className="font-medium text-text-main truncate max-w-[65%]" title={item.producto}>
                                <span className="text-text-muted mr-2 text-xs">#{idx + 1}</span>
                                {item.producto}
                            </span>
                            <span className="font-bold text-text-main">
                                ${item.total_vendido.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-primary to-primary-hover h-2 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${(item.total_vendido / maxVal) * 100}%` }}
                            ></div>
                        </div>
                        <div className="text-[10px] text-text-muted mt-1 text-right">
                            {item.cantidad_vendida.toLocaleString()} unidades vendidas
                        </div>
                    </div>
                ))}

                {data.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-text-muted opacity-50">
                        <span>∅ Sin ventas registradas</span>
                    </div>
                )}
            </div>
        </div>
    );
};