import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const apiClient = axios.create({
    baseURL,
    timeout: 120000, // 2 minutos para reportes pesados
});

// --- INTERCEPTOR DE PETICIÓN (El que pone el Token) ---
apiClient.interceptors.request.use(
    (config) => {
        // Buscamos el token en la caja fuerte del navegador
        const token = localStorage.getItem("token");

        // Si existe, se lo pegamos a la petición
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- INTERCEPTOR DE RESPUESTA (Manejo de errores) ---
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el backend dice "401 No Autorizado", significa que el token venció o es falso
        if (error.response && error.response.status === 401) {
            // Opcional: Podríamos redirigir al login automáticamente aquí
            // window.location.href = "/login"; 
            console.warn("Sesión expirada o inválida");
        }

        if (error.code === 'ECONNABORTED') {
            console.error('Timeout en la petición:', error.config?.url);
            return Promise.reject(new Error('La consulta está tardando demasiado. La base de datos podría estar ocupada.'));
        }
        return Promise.reject(error);
    }
);