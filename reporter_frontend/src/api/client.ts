// reporter_frontend/src/api/client.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const apiClient = axios.create({
    baseURL,
    // AUMENTADO: de 30000 a 120000 (2 minutos)
    // Esto evita que el navegador corte la carga si SQL Server está ocupado
    timeout: 120000,
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('Timeout en la petición:', error.config?.url);
            return Promise.reject(new Error('La consulta está tardando demasiado. La base de datos podría estar ocupada o bloqueada.'));
        }
        return Promise.reject(error);
    }
);