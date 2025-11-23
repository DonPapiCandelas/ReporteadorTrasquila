/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // <--- ¡IMPORTANTE! Esto activa el modo manual
    theme: {
        extend: {
            colors: {
                // 🎨 MAPEO DE VARIABLES CSS
                // Aquí conectamos las clases de utilidad de Tailwind (ej. bg-primary)
                // con las variables CSS definidas en index.css.

                background: "var(--bg-background)", // bg-background
                surface: "var(--bg-surface)",       // bg-surface
                border: "var(--border-color)",      // border-border

                primary: "var(--color-primary)",             // text-primary, bg-primary
                "primary-hover": "var(--color-primary-hover)", // hover:bg-primary-hover

                "text-main": "var(--text-main)",   // text-text-main
                "text-muted": "var(--text-muted)", // text-text-muted

                success: "var(--color-success)", // text-success, bg-success
                danger: "var(--color-danger)",   // text-danger, bg-danger
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            // Animación suave para la entrada de elementos
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}