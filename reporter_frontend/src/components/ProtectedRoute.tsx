import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Componente de Ruta Protegida.
 * 
 * Verifica si existe un token de autenticación en el localStorage.
 * - Si existe: Renderiza el contenido de la ruta (Outlet).
 * - Si no existe: Redirige al usuario a la página de Login.
 */
export const ProtectedRoute: React.FC = () => {
    const token = localStorage.getItem("token");

    // Si no hay token, redirigir a Login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Si hay token, mostrar el contenido (Dashboard, etc.)
    return <Outlet />;
};