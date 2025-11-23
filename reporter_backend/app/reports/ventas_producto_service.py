from typing import Any, Dict, List, Optional, Tuple
from datetime import date, datetime, timedelta
import logging
from functools import lru_cache  # <--- LA CLAVE PARA LA VELOCIDAD (Caché)

from app.core.database import get_connection
from app.schemas.reports import VentasProductoFiltros

# Configuración de Bitácora
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ----------------- Helper para filtros compartidos -----------------

def _build_filtros_where(
    sucursal: Optional[str] = None,
    producto: Optional[str] = None,
    fecha_desde: Optional[Any] = None,
    fecha_hasta: Optional[Any] = None,
    mes: Optional[int] = None,
    anio: Optional[int] = None,
) -> Tuple[str, List[Any]]:
    filtros = ["1=1"]
    params: List[Any] = []

    if sucursal:
        filtros.append("CNOMBREALMACEN = ?")
        params.append(sucursal)

    if producto:
        # El doble %% es pesado, pero necesario para buscar por nombre. 
        # El caché ayudará a que no se sienta lento.
        filtros.append("(CCODIGOPRODUCTO LIKE ? OR CNOMBREPRODUCTO LIKE ?)")
        like = f"%{producto}%"
        params.extend([like, like])

    if fecha_desde:
        filtros.append("CAST(fecha AS date) >= ?")
        params.append(fecha_desde if isinstance(fecha_desde, str) else fecha_desde.isoformat())

    if fecha_hasta:
        filtros.append("CAST(fecha AS date) <= ?")
        params.append(fecha_hasta if isinstance(fecha_hasta, str) else fecha_hasta.isoformat())

    if mes and anio:
        # Optimización Rango de Fechas (SARGable)
        start_date = date(int(anio), int(mes), 1)
        if mes == 12:
            end_date = date(int(anio) + 1, 1, 1)
        else:
            end_date = date(int(anio), int(mes) + 1, 1)
        
        filtros.append("fecha >= ?")
        params.append(start_date)
        filtros.append("fecha < ?")
        params.append(end_date)
    
    elif anio:
        start_date = date(int(anio), 1, 1)
        end_date = date(int(anio) + 1, 1, 1)
        filtros.append("fecha >= ?")
        params.append(start_date)
        filtros.append("fecha < ?")
        params.append(end_date)

    elif mes:
        filtros.append("MONTH(fecha) = ?")
        params.append(int(mes))

    where_sql = " WHERE " + " AND ".join(filtros)
    return where_sql, params


# ----------------- Listado paginado de ventas -----------------

def listar_ventas_producto(
    page: int,
    page_size: int,
    sucursal: Optional[str] = None,
    producto: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    ejecutar: bool = False,
) -> Dict[str, Any]:
    
    if not ejecutar:
        return {"items": [], "total_items": 0, "page": page, "page_size": page_size}

    logger.info(f"--- [TABLA] Iniciando consulta Page={page} ---")

    page = max(page, 1)
    page_size = max(1, min(page_size, 500))
    offset = (page - 1) * page_size

    where_sql, params = _build_filtros_where(
        sucursal=sucursal,
        producto=producto,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        mes=mes,
        anio=anio,
    )

    # Usamos NOLOCK para máxima velocidad en lectura
    sql_count = f"SELECT COUNT(1) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}"

    # Incluimos 'fecha' y usamos NOLOCK
    sql_rows = f"""
        SELECT
            fecha,
            Mes,
            id_pro,
            CCODIGOPRODUCTO,
            CNOMBREPRODUCTO,
            cantidad,
            CNOMBREUNIDAD,
            precio,
            Importe,
            descuento,
            impuesto,
            Total,
            CNOMBREALMACEN
        FROM zzVentasPorProducto WITH (NOLOCK)
        {where_sql}
        ORDER BY id_pro
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
    """

    try:
        with get_connection() as conn:
            cur = conn.cursor()

            # 1. Contar (Esto suele ser lo más lento si no hay filtros)
            cur.execute(sql_count, params)
            total_items = cur.fetchone()[0]

            # 2. Datos
            params_rows = params + [offset, page_size]
            cur.execute(sql_rows, params_rows)
            rows = cur.fetchall()
            
        logger.info(f"--- [TABLA] Éxito. {len(rows)} filas. Total: {total_items} ---")

    except Exception as e:
        logger.error(f"!!! [ERROR BD] {str(e)} !!!")
        raise e

    items: List[Dict[str, Any]] = []
    for r in rows:
        items.append({
            "fecha": str(r[0]) if r[0] else "", 
            "Mes": r[1],
            "id_pro": int(r[2]),
            "CCODIGOPRODUCTO": r[3],
            "CNOMBREPRODUCTO": r[4],
            "cantidad": float(r[5]),
            "CNOMBREUNIDAD": r[6],
            "precio": float(r[7]),
            "Importe": float(r[8]),
            "descuento": float(r[9]),
            "impuesto": float(r[10]),
            "Total": float(r[11]),
            "CNOMBREALMACEN": r[12],
        })

    return {
        "items": items,
        "total_items": int(total_items),
        "page": page,
        "page_size": page_size,
    }


# ----------------- KPIs globales -----------------

def calcular_kpis(filtros: "VentasProductoFiltros") -> Dict[str, Any]:
    logger.info("--- [KPIs] Calculando... ---")
    where_sql, params = _build_filtros_where(
        filtros.sucursal, filtros.producto, filtros.fecha_desde, 
        filtros.fecha_hasta, filtros.mes, filtros.anio
    )

    sql_totales = f"""
        SELECT COUNT(*), ISNULL(SUM(Total), 0), ISNULL(SUM(cantidad), 0) 
        FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}
    """
    sql_distinct = f"""
        SELECT COUNT(DISTINCT id_pro) 
        FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}
    """
    sql_top = f"""
        SELECT TOP 1 CNOMBREALMACEN, SUM(Total) 
        FROM zzVentasPorProducto WITH (NOLOCK) {where_sql} 
        GROUP BY CNOMBREALMACEN ORDER BY 2 DESC
    """

    with get_connection() as conn:
        cur = conn.cursor()
        
        cur.execute(sql_totales, params)
        row = cur.fetchone()
        totales = (row[0], row[1], row[2]) if row else (0, 0, 0)

        cur.execute(sql_distinct, params)
        row_d = cur.fetchone()
        distintos = int(row_d[0]) if row_d else 0
        
        cur.execute(sql_top, params)
        row_t = cur.fetchone()
        top_suc = (row_t[0], float(row_t[1])) if row_t else (None, None)
    
    return {
        "total_vendido": float(totales[1]),
        "unidades_vendidas": float(totales[2]),
        "productos_distintos": distintos,
        "sucursal_top": top_suc[0],
        "sucursal_top_total": top_suc[1],
    }


# ----------------- OPTIMIZACIÓN: CACHÉ DE CATÁLOGOS -----------------

# Esto guarda la respuesta en memoria. Si pides lo mismo de nuevo, es INSTANTÁNEO.
@lru_cache(maxsize=1) 
def obtener_sucursales() -> List[str]:
    logger.info("--- [CACHE] Cargando sucursales de BD... ---")
    sql = """
        SELECT CNOMBREALMACEN 
        FROM admAlmacenes WITH (NOLOCK) 
        WHERE CIDALMACEN IN (4, 3, 5, 6) 
        ORDER BY CNOMBREALMACEN
    """
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql)
        return [r[0] for r in cur.fetchall()]


# Guardamos las últimas 128 búsquedas de productos en memoria RAM
@lru_cache(maxsize=128) 
def obtener_productos(q: Optional[str] = None, top: int = 50) -> List[Dict[str, Any]]:
    logger.info(f"--- [CACHE] Buscando productos: '{q}' ---")
    top = max(1, min(int(top), 200))
    
    sql = f"""
        SELECT TOP {top} CIDPRODUCTO, CCODIGOPRODUCTO, CNOMBREPRODUCTO 
        FROM admProductos WITH (NOLOCK) 
        WHERE CIDPRODUCTO <> 0
    """
    params = []

    if q:
        sql += " AND (CCODIGOPRODUCTO LIKE ? OR CNOMBREPRODUCTO LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like])

    sql += " ORDER BY CCODIGOPRODUCTO"

    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()

    return [{"id_pro": int(r[0]), "codigo": r[1], "nombre": r[2]} for r in rows]


# ----------------- Otros Reportes -----------------

def resumen_por_sucursal_mes_actual(mes: Optional[int] = None, anio: Optional[int] = None) -> List[Dict[str, Any]]:
    now = datetime.now()
    mes = mes or now.month
    anio = anio or now.year
    
    sql = """
        SELECT ISNULL(CNOMBREALMACEN, 'SIN SUCURSAL'), ISNULL(SUM(Total), 0) 
        FROM zzVentasPorProducto WITH (NOLOCK) 
        WHERE YEAR(fecha) = ? AND MONTH(fecha) = ? 
        GROUP BY CNOMBREALMACEN 
        ORDER BY 2 DESC
    """
    if not ejecutar:
        return {"items": [], "total_items": 0, "page": page, "page_size": page_size}

    logger.info(f"--- [TABLA] Iniciando consulta Page={page} ---")

    page = max(page, 1)
    page_size = max(1, min(page_size, 500))
    offset = (page - 1) * page_size

    where_sql, params = _build_filtros_where(
        sucursal=sucursal,
        producto=producto,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        mes=mes,
        anio=anio,
    )

    # Usamos NOLOCK para máxima velocidad en lectura
    sql_count = f"SELECT COUNT(1) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}"

    # Incluimos 'fecha' y usamos NOLOCK
    sql_rows = f"""
        SELECT
            fecha,
            Mes,
            id_pro,
            CCODIGOPRODUCTO,
            CNOMBREPRODUCTO,
            cantidad,
            CNOMBREUNIDAD,
            precio,
            Importe,
            descuento,
            impuesto,
            Total,
            CNOMBREALMACEN
        FROM zzVentasPorProducto WITH (NOLOCK)
        {where_sql}
        ORDER BY id_pro
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY;
    """

    try:
        with get_connection() as conn:
            cur = conn.cursor()

            # 1. Contar (Esto suele ser lo más lento si no hay filtros)
            cur.execute(sql_count, params)
            total_items = cur.fetchone()[0]

            # 2. Datos
            params_rows = params + [offset, page_size]
            cur.execute(sql_rows, params_rows)
            rows = cur.fetchall()
            
        logger.info(f"--- [TABLA] Éxito. {len(rows)} filas. Total: {total_items} ---")

    except Exception as e:
        logger.error(f"!!! [ERROR BD] {str(e)} !!!")
        raise e

    items: List[Dict[str, Any]] = []
    for r in rows:
        items.append({
            "fecha": str(r[0]) if r[0] else "", 
            "Mes": r[1],
            "id_pro": int(r[2]),
            "CCODIGOPRODUCTO": r[3],
            "CNOMBREPRODUCTO": r[4],
            "cantidad": float(r[5]),
            "CNOMBREUNIDAD": r[6],
            "precio": float(r[7]),
            "Importe": float(r[8]),
            "descuento": float(r[9]),
            "impuesto": float(r[10]),
            "Total": float(r[11]),
            "CNOMBREALMACEN": r[12],
        })

    return {
        "items": items,
        "total_items": int(total_items),
        "page": page,
        "page_size": page_size,
    }


# ----------------- KPIs globales -----------------

def calcular_kpis(filtros: "VentasProductoFiltros") -> Dict[str, Any]:
    logger.info("--- [KPIs] Calculando... ---")
    where_sql, params = _build_filtros_where(
        filtros.sucursal, filtros.producto, filtros.fecha_desde, 
        filtros.fecha_hasta, filtros.mes, filtros.anio
    )

    sql_totales = f"""
        SELECT COUNT(*), ISNULL(SUM(Total), 0), ISNULL(SUM(cantidad), 0) 
        FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}
    """
    sql_distinct = f"""
        SELECT COUNT(DISTINCT id_pro) 
        FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}
    """
    sql_top = f"""
        SELECT TOP 1 CNOMBREALMACEN, SUM(Total) 
        FROM zzVentasPorProducto WITH (NOLOCK) {where_sql} 
        GROUP BY CNOMBREALMACEN ORDER BY 2 DESC
    """

    with get_connection() as conn:
        cur = conn.cursor()
        
        cur.execute(sql_totales, params)
        row = cur.fetchone()
        totales = (row[0], row[1], row[2]) if row else (0, 0, 0)

        cur.execute(sql_distinct, params)
        row_d = cur.fetchone()
        distintos = int(row_d[0]) if row_d else 0
        
        cur.execute(sql_top, params)
        row_t = cur.fetchone()
        top_suc = (row_t[0], float(row_t[1])) if row_t else (None, None)
    
    return {
        "total_vendido": float(totales[1]),
        "unidades_vendidas": float(totales[2]),
        "productos_distintos": distintos,
        "sucursal_top": top_suc[0],
        "sucursal_top_total": top_suc[1],
    }


# ----------------- OPTIMIZACIÓN: CACHÉ DE CATÁLOGOS -----------------

# Esto guarda la respuesta en memoria. Si pides lo mismo de nuevo, es INSTANTÁNEO.
@lru_cache(maxsize=1) 
def obtener_sucursales() -> List[str]:
    logger.info("--- [CACHE] Cargando sucursales de BD... ---")
    sql = """
        SELECT CNOMBREALMACEN 
        FROM admAlmacenes WITH (NOLOCK) 
        WHERE CIDALMACEN IN (4, 3, 5, 6) 
        ORDER BY CNOMBREALMACEN
    """
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql)
        return [r[0] for r in cur.fetchall()]


# Guardamos las últimas 128 búsquedas de productos en memoria RAM
@lru_cache(maxsize=128) 
def obtener_productos(q: Optional[str] = None, top: int = 50) -> List[Dict[str, Any]]:
    logger.info(f"--- [CACHE] Buscando productos: '{q}' ---")
    top = max(1, min(int(top), 200))
    
    sql = f"""
        SELECT TOP {top} CIDPRODUCTO, CCODIGOPRODUCTO, CNOMBREPRODUCTO 
        FROM admProductos WITH (NOLOCK) 
        WHERE CIDPRODUCTO <> 0
    """
    params = []

    if q:
        sql += " AND (CCODIGOPRODUCTO LIKE ? OR CNOMBREPRODUCTO LIKE ?)"
        like = f"%{q}%"
        params.extend([like, like])

    sql += " ORDER BY CCODIGOPRODUCTO"

    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()

    return [{"id_pro": int(r[0]), "codigo": r[1], "nombre": r[2]} for r in rows]


# ----------------- Otros Reportes -----------------

def resumen_por_sucursal_mes_actual(mes: Optional[int] = None, anio: Optional[int] = None) -> List[Dict[str, Any]]:
    now = datetime.now()
    mes = mes or now.month
    anio = anio or now.year
    
    sql = """
        SELECT ISNULL(CNOMBREALMACEN, 'SIN SUCURSAL'), ISNULL(SUM(Total), 0) 
        FROM zzVentasPorProducto WITH (NOLOCK) 
        WHERE YEAR(fecha) = ? AND MONTH(fecha) = ? 
        GROUP BY CNOMBREALMACEN 
        ORDER BY 2 DESC
    """
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, [anio, mes])
        return [{"sucursal": r[0], "total_ventas": float(r[1])} for r in cur.fetchall()]

def top_productos(**kwargs): return []
def ventas_por_sucursal(**kwargs): return []
def timeline_ventas(**kwargs): return []

# ----------------- Exportación Excel -----------------

from app.reports.excel_generator import generar_excel_ventas_producto
from io import BytesIO

def exportar_ventas_excel(
    sucursal: Optional[str] = None,
    producto: Optional[str] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    mes: Optional[int] = None,
    anio: Optional[int] = None,
) -> BytesIO:
    logger.info("--- [EXPORT] Iniciando exportación Excel ---")
    
    where_sql, params = _build_filtros_where(
        sucursal=sucursal,
        producto=producto,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        mes=mes,
        anio=anio,
    )

    # Consulta SIN paginación (Cuidado con volúmenes masivos)
    sql = f"""
        SELECT
            fecha,
            Mes,
            id_pro,
            CCODIGOPRODUCTO,
            CNOMBREPRODUCTO,
            cantidad,
            CNOMBREUNIDAD,
            precio,
            Importe,
            descuento,
            impuesto,
            Total,
            CNOMBREALMACEN
        FROM zzVentasPorProducto WITH (NOLOCK)
        {where_sql}
        ORDER BY id_pro
    """

    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()

    items = []
    for r in rows:
        items.append({
            "fecha": str(r[0]) if r[0] else "", 
            "Mes": r[1],
            "id_pro": int(r[2]),
            "CCODIGOPRODUCTO": r[3],
            "CNOMBREPRODUCTO": r[4],
            "cantidad": float(r[5]),
            "CNOMBREUNIDAD": r[6],
            "precio": float(r[7]),
            "Importe": float(r[8]),
            "descuento": float(r[9]),
            "impuesto": float(r[10]),
            "Total": float(r[11]),
            "CNOMBREALMACEN": r[12],
        })
    
    logger.info(f"--- [EXPORT] Generando Excel con {len(items)} filas ---")
    
    # Determinar texto de sucursal para el encabezado
    sucursal_texto = sucursal if sucursal else "TODAS LAS SUCURSALES"
    
    return generar_excel_ventas_producto(items, sucursal_texto)