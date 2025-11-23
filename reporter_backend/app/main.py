from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import traceback

# Importamos tus rutas
from app.api.v1 import ventas_producto, dashboard

app = FastAPI(title="Reportes Ventas Producto", version="0.1.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DIAGNÓSTICO: MIDDLEWARE GLOBAL DE ERRORES ---
# Esto atrapará el error aunque ocurra antes de llegar a tu función
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    print(f"\n➡️ Recibiendo petición: {request.method} {request.url}")
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
        traceback.print_exc() # <--- ESTO NOS DIRÁ LA VERDAD
        print("!"*50 + "\n")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error interno: {str(e)}"}
        )
# -----------------------------------------------------

app.include_router(
    ventas_producto.router,
    prefix="/api/v1/ventas-producto",
    tags=["ventas_producto"],
)

app.include_router(
    dashboard.router,
    prefix="/api/v1/dashboard",
    tags=["dashboard"],
)

@app.get("/health")
def health():
    return {"status": "ok"}