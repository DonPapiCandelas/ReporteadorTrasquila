import { apiClient } from "./client";

// Definimos los tipos de datos
export interface LoginParams {
    username: string;  // FastAPI espera 'username' en OAuth2 standard, pero nuestro esquema usa 'usuario'
    password: string;  // Lo mapearemos en la función
}

export interface RegisterParams {
    usuario: string;
    password: string;
    nombre: string;
    apellido: string;
    sucursal_registro: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: {
        id: number;
        usuario: string;
        nombre: string;
        rol: string;
        sucursales_permitidas: string[];
    };
}

export async function login(creds: LoginParams) {
    // Nuestro backend espera un JSON con "usuario" y "password"
    const res = await apiClient.post<AuthResponse>("/api/v1/auth/login", {
        usuario: creds.username,
        password: creds.password
    });
    return res.data;
}

export async function register(data: RegisterParams) {
    const res = await apiClient.post("/api/v1/auth/register", data);
    return res.data;
}