import React, { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { fetchUsers, updateUser, type User } from "../api/users";
import { fetchSucursales } from "../api/ventasProducto"; // Para llenar el combo

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [sucursalesList, setSucursalesList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para el Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, sucsData] = await Promise.all([
                fetchUsers(),
                fetchSucursales()
            ]);
            setUsers(usersData);
            setSucursalesList(sucsData);
        } catch (error) {
            console.error(error);
            alert("Error cargando datos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- MANEJADORES DE ACCIÓN ---

    const handleEditClick = (user: User) => {
        setEditingUser({ ...user, password: "" }); // Password vacío por defecto
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!editingUser || !editingUser.id) return;

        try {
            // Preparamos el objeto a enviar (filtramos campos vacíos si es necesario)
            const payload: any = {
                nombre: editingUser.nombre,
                apellido: editingUser.apellido,
                rol: editingUser.rol,
                estatus: editingUser.estatus,
                sucursal_registro: editingUser.sucursal_registro
            };

            // Solo enviamos password si escribió algo (para resetear)
            if (editingUser.password && editingUser.password.trim() !== "") {
                payload.password = editingUser.password;
            }

            await updateUser(editingUser.id, payload);

            setIsModalOpen(false);
            setEditingUser(null);
            loadData(); // Recargar tabla
            alert("Usuario actualizado correctamente.");
        } catch (e) {
            alert("Error al actualizar.");
        }
    };

    return (
        <Layout>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-main">Administración de Usuarios</h1>
                    <p className="text-sm text-text-muted">Gestiona accesos, roles y contraseñas</p>
                </div>
                <button onClick={loadData} className="btn btn-secondary text-xs">🔄 Recargar</button>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-background text-text-muted uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Usuario</th>
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3">Sucursal Asignada</th>
                                <th className="px-6 py-3">Rol</th>
                                <th className="px-6 py-3">Estatus</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-6 text-center">Cargando...</td></tr>
                            ) : users.map((u) => (
                                <tr key={u.id} className="hover:bg-background/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-text-main">{u.usuario}</td>
                                    <td className="px-6 py-4 text-text-muted">{u.nombre} {u.apellido}</td>
                                    <td className="px-6 py-4 text-text-muted">
                                        {u.sucursal_registro || <span className="text-yellow-500 font-bold">⚠️ Sin Asignar</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs border ${u.rol === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${u.estatus === 'activo' ? 'bg-success/10 text-success border-success/20' :
                                                u.estatus === 'pendiente' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                    'bg-danger/10 text-danger border-danger/20'
                                            }`}>
                                            {u.estatus.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEditClick(u)}
                                            className="btn btn-secondary px-3 py-1 h-8 text-xs"
                                        >
                                            ✏️ Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL DE EDICIÓN --- */}
            {isModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface w-full max-w-2xl rounded-xl shadow-2xl border border-border animate-fade-in">

                        {/* Header Modal */}
                        <div className="flex justify-between items-center p-6 border-b border-border">
                            <h3 className="text-xl font-bold text-text-main">
                                Editando: <span className="text-primary">{editingUser.usuario}</span>
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main">✕</button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Columna 1: Datos Personales */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Datos Generales</h4>
                                <div>
                                    <label className="text-xs text-text-muted block mb-1">Nombre</label>
                                    <input
                                        className="form-control"
                                        value={editingUser.nombre}
                                        onChange={e => setEditingUser({ ...editingUser, nombre: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted block mb-1">Apellido</label>
                                    <input
                                        className="form-control"
                                        value={editingUser.apellido}
                                        onChange={e => setEditingUser({ ...editingUser, apellido: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Columna 2: Permisos */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Permisos y Acceso</h4>
                                <div>
                                    <label className="text-xs text-text-muted block mb-1">Sucursal Asignada</label>
                                    <select
                                        className="form-control"
                                        value={editingUser.sucursal_registro || ""}
                                        onChange={e => setEditingUser({ ...editingUser, sucursal_registro: e.target.value })}
                                    >
                                        <option value="TODAS">TODAS (Gerente General)</option>
                                        {sucursalesList.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-text-muted block mb-1">Rol</label>
                                        <select
                                            className="form-control"
                                            value={editingUser.rol}
                                            onChange={e => setEditingUser({ ...editingUser, rol: e.target.value })}
                                        >
                                            <option value="usuario">Usuario</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted block mb-1">Estatus</label>
                                        <select
                                            className="form-control"
                                            value={editingUser.estatus}
                                            onChange={e => setEditingUser({ ...editingUser, estatus: e.target.value })}
                                        >
                                            <option value="pendiente">Pendiente</option>
                                            <option value="activo">Activo</option>
                                            <option value="bloqueado">Bloqueado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Sección de Seguridad (Password Reset) */}
                            <div className="col-span-1 md:col-span-2 pt-4 border-t border-border">
                                <h4 className="text-xs font-bold text-danger uppercase mb-2">Zona de Peligro (Resetear Contraseña)</h4>
                                <div className="bg-danger/5 p-4 rounded border border-danger/10">
                                    <label className="text-xs text-text-muted block mb-1">Nueva Contraseña (Opcional)</label>
                                    <input
                                        type="password"
                                        className="form-control border-danger/20 focus:ring-danger/50"
                                        placeholder="Dejar vacío para no cambiar"
                                        value={editingUser.password || ""}
                                        onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                                    />
                                    <p className="text-[10px] text-text-muted mt-1">Solo escribe aquí si el usuario olvidó su contraseña.</p>
                                </div>
                            </div>

                        </div>

                        {/* Footer Modal */}
                        <div className="p-6 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};