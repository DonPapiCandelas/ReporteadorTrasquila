```typescript
// src/components/Layout.tsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface LayoutProps {
    children: React.ReactNode;
}

/**
 * Componente principal de diseño (Layout) que envuelve a todas las páginas.
 * 
 * Incluye:
 * - Barra lateral (Sidebar) colapsable con menú de navegación.
 * - Encabezado superior (Header) con información del usuario.
 * - Área principal de contenido (Main) donde se renderizan las páginas.
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation(); // Para saber en qué ruta estamos
    const navigate = useNavigate();

    // 1. LEER USUARIO (Para saber si mostramos el panel de Admin)
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const isAdmin = user?.rol === "admin";

    // 2. DEFINIR MENÚ
    // Nota: Ajustamos 'path' para que la navegación sea real.
    // Los que dicen '/dashboard' son placeholders hasta que crees esas pantallas.
    const menuItems = [
        { icon: "📊", label: "Dashboard General", path: "/dashboard" },
        { icon: "🎫", label: "Análisis de Tickets", path: "/dashboard" },
        { icon: "⏰", label: "Horas Pico", path: "/dashboard" },
        { icon: "📦", label: "Inventario", path: "/dashboard" },
        { icon: "⚙️", label: "Configuración", path: "/dashboard" },
    ];

    // 3. AGREGAR ITEM DE ADMIN CONDICIONALMENTE
    if (isAdmin) {
        menuItems.push({ icon: "👥", label: "Usuarios", path: "/admin/users" });
    }

    // 4. FUNCIÓN DE CERRAR SESIÓN
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
                            Trasquila<span className="text-primary">BI</span>
                        </span>
                    )}
                </div>

                {/* Menu */}
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-2 px-3">
                        {menuItems.map((item) => {
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer Sidebar */}
                <div className="border-t border-border p-4 space-y-2">
                    {/* Botón Colapsar */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="flex w-full justify-center rounded-md border border-border p-2 text-text-muted hover:bg-gray-100 dark:hover:bg-white/10 hover:text-text-main transition-colors"
                        title={isSidebarOpen ? "Colapsar menú" : "Expandir menú"}
                    >
                        {isSidebarOpen ? "◀ Ocultar" : "▶"}
                    </button>

                    {/* Botón Salir */}
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
                        {/* Avatar Simulado */}
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 border-2 border-white dark:border-surface shadow-sm"></div>
                    </div>
                </header>

                {/* Área de Scroll para el Dashboard */}
                <main className="flex-1 overflow-y-auto bg-background p-6 scroll-smooth">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
```