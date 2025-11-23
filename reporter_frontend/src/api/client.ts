import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const apiClient = axios.create({
    baseURL,
    timeout: 30000, // 30 segundos para consultas iniciales
});

// Interceptor para manejar errores de timeout
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNABORTED') {
            console.error('Timeout en la petición:', error.config?.url);
            return Promise.reject(new Error('La consulta está tardando demasiado. Intenta con filtros más específicos.'));
        }
        return Promise.reject(error);
    }
);
