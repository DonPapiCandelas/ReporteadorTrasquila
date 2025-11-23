from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
