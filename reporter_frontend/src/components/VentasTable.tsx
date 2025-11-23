// src/components/VentasTable.tsx
import React from "react";
import type { VentasProductoRow } from "../types/reportes";

interface Props {
    rows: VentasProductoRow[];
}

export const VentasTable: React.FC<Props> = ({ rows }) => {
    return (
        <div
            style={{
                marginTop: "0",
                borderRadius: "0.5rem",
                overflowX: "auto",
                overflowY: "visible",
                background: "#020617",
                border: "1px solid rgba(148,163,184,0.3)",
                width: "100%",
                maxWidth: "100%",
            }}
        >
            <table
                style={{
                    width: "100%",
                    minWidth: "800px",
                    borderCollapse: "collapse",
                    fontSize: "0.875rem",
                }}
            >
                <thead style={{ background: "#0b1120" }}>
                    <tr>
                        <th style={th}>Sucursal</th>
                        <th style={th}>Fecha</th>
                        <th style={th}>Código</th>
                        <th style={th}>Producto</th>
                        <th style={th}>Cantidad</th>
                        <th style={th}>Importe</th>
                        <th style={th}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, idx) => (
                        <tr
                            key={idx}
                            style={{
                                borderTop: "1px solid rgba(30,41,59,0.8)",
                                background: idx % 2 === 0 ? "#020617" : "#02081b",
                            }}
                        >
                            <td style={td}>{r.CNOMBREALMACEN ?? "—"}</td>
                            <td style={td}>
                                {/* VALIDACIÓN: Si r.fecha existe, cortamos. Si no, mostramos "—" */}
                                {r.fecha ? String(r.fecha).substring(0, 10) : "—"}
                            </td>
                            <td style={td}>{r.CCODIGOPRODUCTO}</td>
                            <td style={td}>{r.CNOMBREPRODUCTO}</td>
                            <td style={td}>{Number(r.cantidad || 0).toFixed(2)}</td>
                            <td style={td}>{Number(r.Importe || 0).toFixed(2)}</td>
                            <td style={td}>{Number(r.Total || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const th: React.CSSProperties = {
    padding: "0.75rem 1rem",
    textAlign: "left",
    position: "sticky",
    top: 0,
    zIndex: 1,
    fontWeight: 600,
    fontSize: "0.875rem",
};

const td: React.CSSProperties = {
    padding: "0.625rem 1rem",
    whiteSpace: "nowrap",
    fontSize: "0.875rem",
};