from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import traceback
import os

# Importación de routers (controladores) de la API
from app.api.v1 import ventas_producto, dashboard, auth, users

# Inicialización de la aplicación FastAPI
app = FastAPI(title="Reportes Ventas Producto", version="1.0.0")

# --- CONFIGURACIÓN CORS ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://latrasquila.local:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MIDDLEWARE GLOBAL DE MANEJO DE ERRORES ---
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
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
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Usuarios"])
app.include_router(ventas_producto.router, prefix="/api/v1/ventas-producto", tags=["Ventas Producto"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])

# --- ENDPOINT DE SALUD ---
@app.get("/health", tags=["General"])
def health():
    return {"status": "ok"}

# --- SERVIR FRONTEND ---
# Ruta al directorio dist del frontend
# app/main.py -> app -> reporter_backend -> ReportesWeb -> reporter_frontend/dist
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
frontend_dist = os.path.join(base_dir, "reporter_frontend", "dist")

print(f"Buscando frontend en: {frontend_dist}")

if os.path.exists(frontend_dist):
    # Montar archivos estáticos (JS, CSS, imágenes)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    # Manejador explícito para la raíz
    @app.get("/")
    async def serve_root():
        print(f"SERVING ROOT: {os.path.join(frontend_dist, 'index.html')}")
        if not os.path.exists(os.path.join(frontend_dist, "index.html")):
             return JSONResponse(status_code=404, content={"error": "Index file not found on disk"})
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    # Servir index.html para cualquier otra ruta (SPA)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
             return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    print(f"ADVERTENCIA: No se encontró el directorio del frontend en {frontend_dist}")
    
    @app.get("/")
    def serve_root_debug():
        return {
            "error": "Frontend not found",
            "searched_path": frontend_dist,
            "current_dir": os.getcwd(),
            "base_dir": base_dir,
            "contents_of_base": os.listdir(base_dir) if os.path.exists(base_dir) else "Base dir not found"
        }