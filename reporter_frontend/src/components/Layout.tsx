// src/components/Layout.tsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    // 1. LEER USUARIO (Para saber si mostramos el panel de Admin)
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const isAdmin = user?.rol === "admin";

    // 2. DEFINIR MENÚ COMPLETO (Restaurado)
    // Nota: Los items que no tienen ruta real apuntan a "/dashboard" temporalmente
    const menuItems = [
        { icon: "📊", label: "Dashboard General", path: "/dashboard" },
        { icon: "🎫", label: "Análisis de Tickets", path: "/tickets" },
        { icon: "⏰", label: "Horas Pico", path: "/dashboard" },        // Placeholder
        { icon: "📦", label: "Inventario", path: "/dashboard" },        // Placeholder
        { icon: "⚙️", label: "Configuración", path: "/dashboard" },     // Placeholder
    ];

    // 3. AGREGAR ITEM DE ADMIN CONDICIONALMENTE
    if (isAdmin) {
        menuItems.push({ icon: "👥", label: "Usuarios", path: "/admin/users" });
    }

    // 4. FUNCIÓN DE CERRAR SESIÓN (Corregida)
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="flex h-screen w-full bg-background text-text-main transition-colors duration-300">
            {/* --- SIDEBAR --- */}
            <aside
                className={`flex flex-col border-r border-border bg-surface transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"
                    }`}
            >
                {/* Logo Area */}
                <div className="flex h-16 items-center justify-center border-b border-border px-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-2xl">
                        🛒
                    </div>
                    {isSidebarOpen && (
                        <span className="ml-3 text-lg font-bold tracking-tight text-text-main animate-fade-in">
                            Trasquila<span className="text-primary">BI</span>
                        </span>
                    )}
                </div>

                {/* Menu Scrollable */}
                <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <ul className="space-y-1 px-3">
                        {menuItems.map((item, idx) => {
                            const isActive = location.pathname === item.path && item.label === "Dashboard General";
                            // Nota: Ajusté la lógica de 'isActive' para que no se iluminen todos los placeholders a la vez

                            return (
                                <li key={idx}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center rounded-md px-3 py-2.5 transition-colors group ${isActive
                                            ? "bg-primary text-white shadow-md shadow-primary/20"
                                            : "text-text-muted hover:bg-gray-100 dark:hover:bg-white/5 hover:text-text-main"
                                            } ${!isSidebarOpen && "justify-center"}`}
                                        title={!isSidebarOpen ? item.label : ""}
                                    >
                                        <span className="text-xl flex-shrink-0">{item.icon}</span>

                                        {isSidebarOpen && (
                                            <span className="ml-3 text-sm font-medium truncate">
                                                {item.label}
                                            </span>
                                        )}

                                        {/* Tooltip flotante cuando está cerrado (Opcional/Estético) */}
                                        {!isSidebarOpen && (
                                            <div className="absolute left-full ml-2 hidden rounded bg-surface border border-border px-2 py-1 text-xs text-text-main shadow-lg group-hover:block z-50 whitespace-nowrap">
                                                {item.label}
                                            </div>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer Sidebar */}
                <div className="border-t border-border p-4 space-y-2">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="flex w-full justify-center rounded-md border border-border p-2 text-text-muted hover:bg-gray-100 dark:hover:bg-white/10 hover:text-text-main transition-colors"
                        title={isSidebarOpen ? "Colapsar menú" : "Expandir menú"}
                    >
                        {isSidebarOpen ? "◀ Ocultar" : "▶"}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-danger/10 p-2 text-danger hover:bg-danger hover:text-white transition-colors"
                        title="Cerrar Sesión"
                    >
                        <span>🚪</span>
                        {isSidebarOpen && <span className="text-sm font-medium">Salir</span>}
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Header Superior */}
                <header className="flex h-16 items-center justify-between border-b border-border bg-surface/90 px-6 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-lg font-semibold text-text-main">
                            Vista General
                        </h2>
                        <p className="text-xs text-text-muted">
                            Bienvenido, {user?.nombre || 'Usuario'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 border border-success/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                            </span>
                            <span className="text-xs font-medium text-success">En Línea</span>
                        </div>
                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 border-2 border-white dark:border-surface shadow-sm"></div>
                    </div>
                </header>

                {/* Área de Scroll para el Dashboard */}
                <main className="flex-1 overflow-y-auto bg-background p-2 md:p-4 scroll-smooth">
                    <div className="mx-auto w-full max-w-[99%]"> {/* Antes era max-w-7xl */}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};