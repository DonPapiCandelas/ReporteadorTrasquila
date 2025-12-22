import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminUsers } from "./pages/AdminUsers";
import { TicketAnalysis } from "./pages/TicketAnalysis";

/**
 * Componente principal de la aplicación.
 * Define la estructura de rutas y la navegación.
 * 
 * Estructura de Rutas:
 * - Públicas: /login, /register
 * - Privadas: /dashboard, /admin/users (requieren autenticación)
 * - Redirecciones: '/' -> '/dashboard', '*' -> '/'
 * 
 * @returns {JSX.Element} Jerarquía de rutas de la aplicación
 */
const App: React.FC = () => {
  console.log("App.tsx: Rendering App component");
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas Privadas (Protegidas por Login) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<TicketAnalysis />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          {/* Redirigir la raíz '/' al dashboard (el guardia lo mandará a login si no hay sesión) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Ruta 404 - Redirigir a inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;