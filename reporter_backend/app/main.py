from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback

# Importación de routers (controladores) de la API
from app.api.v1 import ventas_producto, dashboard, auth, users

# Inicialización de la aplicación FastAPI
# title: Título que aparecerá en la documentación automática (Swagger UI)
# version: Versión actual de la API
app = FastAPI(title="Reportes Ventas Producto", version="1.0.0")

# --- CONFIGURACIÓN CORS ---
# Define qué dominios pueden acceder a esta API.
# En desarrollo, usualmente se permite localhost.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"], # Permite todos los headers
)

# --- MIDDLEWARE GLOBAL DE MANEJO DE ERRORES ---
# Captura cualquier excepción no controlada en la aplicación para evitar que el servidor se detenga
# y devuelve una respuesta JSON con un mensaje de error genérico.
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    # print(f"\n➡️ Recibiendo petición: {request.method} {request.url}") # Descomentar para debug
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        print("\n" + "!"*50)
        print("🔥 ERROR FATAL NO CAPTURADO (MIDDLEWARE) 🔥")
        print(f"Ruta afectada: {request.url}")
        print(f"Tipo de Error: {type(e).__name__}")
        print(f"Mensaje: {e}")
        print("-" * 20)
        print("TRACEBACK COMPLETO:")
        traceback.print_exc()
        print("!"*50 + "\n")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error interno del servidor: {str(e)}"}
        )

# --- REGISTRO DE ROUTERS ---
# Aquí se conectan las diferentes partes de la API a la aplicación principal.

# Autenticación (Login, Registro)
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Autenticación"],
)

# Gestión de Usuarios (CRUD de usuarios)
app.include_router(
    users.router,
    prefix="/api/v1/users",
    tags=["Usuarios"],
)

# Reportes de Ventas por Producto
app.include_router(
    ventas_producto.router,
    prefix="/api/v1/ventas-producto",
    tags=["Ventas Producto"],
)

# Dashboard Ejecutivo (KPIs, Gráficas)
app.include_router(
    dashboard.router,
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
)

# --- ENDPOINT DE SALUD ---
# Útil para verificar si el backend está corriendo correctamente.
@app.get("/health", tags=["General"])
def health():
    """
    Verifica el estado del servicio.
    Retorna {"status": "ok"} si el servidor está funcionando.
    """
    return {"status": "ok"}