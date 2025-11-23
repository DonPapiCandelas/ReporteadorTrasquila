import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await login({ username: usuario, password });

            // Guardar sesión
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirigir al Dashboard
            navigate("/dashboard");
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError("Usuario o contraseña incorrectos.");
            } else if (err.response?.status === 403) {
                setError(err.response.data.detail || "Acceso denegado.");
            } else {
                setError("Error de conexión. Intenta más tarde.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background z-0"></div>

            <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-2xl border border-border relative z-10 animate-fade-in">

                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <span className="text-3xl">🛒</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main">Bienvenido</h1>
                    <p className="text-sm text-text-muted mt-2">
                        Inicia sesión en Trasquila<span className="text-primary">BI</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-md bg-danger/10 border border-danger/20 text-danger text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-text-muted mb-1 uppercase tracking-wide">
                            Usuario
                        </label>
                        <input
                            type="text"
                            required
                            className="form-control h-12 bg-background"
                            placeholder="Ej. jperalta"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-muted uppercase tracking-wide">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            required
                            className="form-control h-12 bg-background"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full h-12 text-base shadow-lg shadow-primary/20"
                    >
                        {loading ? "Validando..." : "Ingresar"}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-border">
                    <p className="text-sm text-text-muted">
                        ¿No tienes cuenta?{" "}
                        <Link to="/register" className="text-primary font-semibold hover:text-primary-hover transition-colors">
                            Solicitar Acceso
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};