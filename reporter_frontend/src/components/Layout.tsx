// src/components/Layout.tsx
import React from "react";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "radial-gradient(circle at top, #1f2937 0, #020617 60%)",
                color: "#e5e7eb",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <header
                style={{
                    padding: "0.75rem 1.5rem",
                    borderBottom: "1px solid rgba(148,163,184,0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backdropFilter: "blur(10px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                }}
            >
                <span style={{ fontWeight: 600 }}>Reporteador · Ventas por producto</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>v0.1 backend listo</span>
            </header>

            <main
                style={{
                    flex: 1,
                    padding: "1rem",
                    maxWidth: "100%",
                    width: "100%",
                    margin: "0 auto",
                    boxSizing: "border-box",
                    overflowX: "auto",
                }}
            >
                <div style={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                }}>
                    {children}
                </div>
            </main>
        </div>
    );
};
