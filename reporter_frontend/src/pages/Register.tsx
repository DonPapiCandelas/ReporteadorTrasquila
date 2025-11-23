import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { register } from "../api/auth";
import { fetchSucursales } from "../api/ventasProducto";

export const Register: React.FC = () => {
    // Estado del formulario
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        usuario: "",
        password: "",
        confirmPassword: "",
        sucursal: ""
    });

    const [sucursales, setSucursales] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSucursales()
            .then(setSucursales)
            .catch(err => console.error("Error cargando sucursales", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (formData.password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);

        try {
            await register({
                nombre: formData.nombre,
                apellido: formData.apellido,
                usuario: formData.usuario,
                password: formData.password,
                sucursal_registro: formData.sucursal
            });
            setSuccess(true);
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 400) {
                setError(err.response.data.detail || "Datos inválidos.");
            } else {
                setError("Error al registrar. Intenta más tarde.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-2xl border border-border text-center animate-fade-in">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success text-3xl mb-4">
                        ✅
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-2">¡Registro Exitoso!</h2>
                    <p className="text-text-muted mb-6">
                        Tu cuenta ha sido creada y está <strong>pendiente de aprobación</strong>.
                        <br />
                        Notifica al administrador para que active tu acceso.
                    </p>
                    <Link to="/login" className="btn btn-primary w-full">
                        Volver al Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 py-10">
            <div className="w-full max-w-lg bg-surface p-8 rounded-2xl shadow-2xl border border-border animate-fade-in">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-text-main">Crear Cuenta</h1>
                    <p className="text-sm text-text-muted">Solicita acceso al sistema</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded bg-danger/10 border border-danger/20 text-danger text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-text-muted uppercase">Nombre</label>
                            <input name="nombre" required className="form-control" value={formData.nombre} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-muted uppercase">Apellido</label>
                            <input name="apellido" required className="form-control" value={formData.apellido} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-text-muted uppercase">Usuario</label>
                        <input name="usuario" required className="form-control" placeholder="Ej. jperalta" value={formData.usuario} onChange={handleChange} />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-text-muted uppercase">Sucursal Principal</label>
                        <select name="sucursal" required className="form-control" value={formData.sucursal} onChange={handleChange}>
                            <option value="">Selecciona una opción...</option>
                            <option value="TODAS">Soy Gerente General / Director (Todas)</option>
                            {sucursales.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-text-muted uppercase">Contraseña</label>
                            <input type="password" name="password" required className="form-control" value={formData.password} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-muted uppercase">Confirmar</label>
                            <input type="password" name="confirmPassword" required className="form-control" value={formData.confirmPassword} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="btn btn-primary w-full h-12 text-base">
                            {loading ? "Registrando..." : "Solicitar Registro"}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center pt-4 border-t border-border">
                    <p className="text-sm text-text-muted">
                        ¿Ya tienes cuenta?{" "}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Iniciar Sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};