import React from "react";
import "./Layout.css"; // <--- Importar estilos

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="app-layout">
            <header className="app-header">
                <span className="header-brand">
                    🛒 Reporteador · La Trasquila
                </span>
                <span className="header-meta">
                    v1.2 Producción
                </span>
            </header>

            <main className="app-main">
                <div className="content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};