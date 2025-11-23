// src/components/KpiCard.tsx
import React from "react";

interface KpiCardProps {
    label: string;
    value: string | number;
    subtle?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtle }) => {
    return (
        <div
            style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                background: "#0f172a",
                color: "#e5e7eb",
                boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                minWidth: 0,
            }}
        >
            <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>{label}</span>
            <span style={{ fontSize: "1.6rem", fontWeight: 600 }}>{value}</span>
            {subtle && (
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>{subtle}</span>
            )}
        </div>
    );
};
