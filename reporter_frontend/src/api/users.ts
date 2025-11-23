import { apiClient } from "./client";

export interface User {
    id: number;
    usuario: string;
    nombre: string;
    apellido: string;
    rol: string;
    estatus: string;
    sucursal_registro: string;
    ultimo_login: string;
}

export async function fetchUsers() {
    const token = localStorage.getItem("token");
    const res = await apiClient.get<User[]>("/api/v1/users/", {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
}

// Actualizamos para que acepte un objeto parcial completo
export async function updateUser(id: number, data: Partial<User> & { password?: string }) {
    const token = localStorage.getItem("token");
    const res = await apiClient.put(`/api/v1/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
}