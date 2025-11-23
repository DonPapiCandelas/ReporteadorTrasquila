import React from "react";
import type { VentasProductoRow } from "../types/reportes";
import "./VentasTable.css"; // <--- Importamos el CSS

interface Props {
    rows: VentasProductoRow[];
}

export const VentasTable: React.FC<Props> = ({ rows }) => {

    const formatearFecha = (fechaISO: string | null | undefined) => {
        if (!fechaISO) return "—";
        const soloFecha = String(fechaISO).substring(0, 10);
        const [anio, mes, dia] = soloFecha.split("-");
        return `${dia}/${mes}/${anio}`;
    };

    return (
        <div className="table-container">
            <table className="ventas-table">
                <thead>
                    <tr>
                        <th>Sucursal</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Precio</th>
                        <th>Importe</th>
                        <th>Descuento</th>
                        <th>Impuesto</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, idx) => (
                        <tr key={idx}>
                            <td>{r.CNOMBREALMACEN ?? "—"}</td>
                            <td>{formatearFecha(r.fecha)}</td>
                            <td>{(r as any).hora || "—"}</td>
                            <td>{r.CCODIGOPRODUCTO}</td>
                            <td title={r.CNOMBREPRODUCTO}>
                                {r.CNOMBREPRODUCTO.length > 40
                                    ? r.CNOMBREPRODUCTO.substring(0, 40) + "..."
                                    : r.CNOMBREPRODUCTO}
                            </td>
                            <td>{Number(r.cantidad || 0).toFixed(2)}</td>
                            <td>{r.CNOMBREUNIDAD ?? "—"}</td>
                            <td>${Number(r.precio || 0).toFixed(2)}</td>
                            <td>${Number(r.Importe || 0).toFixed(2)}</td>
                            <td>${Number(r.descuento || 0).toFixed(2)}</td>
                            <td>${Number(r.impuesto || 0).toFixed(2)}</td>
                            <td className="text-total">
                                ${Number(r.Total || 0).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};