import React from "react";
import "./KpiCard.css"; // <--- Importar estilos

interface KpiCardProps {
    label: string;
    value: string | number;
    subtle?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtle }) => {
    return (
        <div className="kpi-card">
            <span className="kpi-label">{label}</span>
            <span className="kpi-value">{value}</span>
            {subtle && (
                <span className="kpi-subtle">{subtle}</span>
            )}
        </div>
    );
};