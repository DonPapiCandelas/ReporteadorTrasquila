import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- AGREGA ESTA PARTE DE ABAJO ---
  server: {
    host: true,  // Esto permite conexiones externas (lo que intentamos con --host)
    allowedHosts: ['latrasquila.local'] // Esto autoriza el nombre específico
  }

})