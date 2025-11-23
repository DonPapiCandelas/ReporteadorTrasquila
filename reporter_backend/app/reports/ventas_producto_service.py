from typing import Any, Dict, List, Optional, Tuple
from datetime import date, datetime, timedelta
import logging
import traceback

from app.core.database import get_connection
from app.schemas.reports import VentasProductoFiltros

# Configuración de Bitácora
logger = logging.getLogger("uvicorn.error")

# ----------------- Helper para filtros (VERSIÓN FINAL CONSOLIDADA) -----------------

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
        # Corrección: Ignorar espacios en blanco en la BD
        filtros.append("LTRIM(RTRIM(CNOMBREALMACEN)) = ?")
        params.append(sucursal.strip())

    if producto:
        filtros.append("(CCODIGOPRODUCTO LIKE ? OR CNOMBREPRODUCTO LIKE ?)")
        like = f"%{producto}%"
        params.extend([like, like])

    # --- ESTRATEGIA DE FECHAS (NATIVA) ---
    usando_rango = False

    if fecha_desde:
        usando_rango = True
        filtros.append("fecha >= ?")
        if isinstance(fecha_desde, str):
            fecha_desde = datetime.strptime(fecha_desde, "%Y-%m-%d").date()
        params.append(fecha_desde)

    if fecha_hasta:
        usando_rango = True
        filtros.append("fecha < ?") # Menor estricto al día siguiente
        if isinstance(fecha_hasta, str):
            fecha_hasta = datetime.strptime(fecha_hasta, "%Y-%m-%d").date()
        fecha_fin_corte = fecha_hasta + timedelta(days=1)
        params.append(fecha_fin_corte)

    # Solo aplicamos Mes/Año si no hay rango
    if not usando_rango:
        if mes and anio:
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


# ----------------- Listado (PANTALLA) -----------------

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

    sql_count = f"SELECT COUNT(1) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql} OPTION (RECOMPILE);"

    # Incluimos 'hora' en la posición correcta
    sql_rows = f"""
        SELECT
            fecha, Mes, hora, id_pro, CCODIGOPRODUCTO, CNOMBREPRODUCTO,
            cantidad, CNOMBREUNIDAD, precio, Importe, descuento,
            impuesto, Total, CNOMBREALMACEN
        FROM zzVentasPorProducto WITH (NOLOCK)
        {where_sql}
        ORDER BY fecha DESC, hora DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
        OPTION (RECOMPILE);
    """

    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(sql_count, params)
        total_items = cursor.fetchone()[0]

        params_rows = params + [offset, page_size]
        cursor.execute(sql_rows, params_rows)
        rows = cursor.fetchall()
        
        logger.info(f"--- [TABLA] Éxito. {len(rows)} filas. ---")

        items: List[Dict[str, Any]] = []
        for r in rows:
            items.append({
                "fecha": str(r[0]) if r[0] else "", 
                "Mes": r[1],
                "hora": str(r[2]) if r[2] else "",
                "id_pro": int(r[3]),
                "CCODIGOPRODUCTO": r[4],
                "CNOMBREPRODUCTO": r[5],
                "cantidad": float(r[6]),
                "CNOMBREUNIDAD": r[7],
                "precio": float(r[8]),
                "Importe": float(r[9]),
                "descuento": float(r[10]),
                "impuesto": float(r[11]),
                "Total": float(r[12]),
                "CNOMBREALMACEN": r[13],
            })

        return {
            "items": items,
            "total_items": int(total_items),
            "page": page,
            "page_size": page_size,
        }

    except Exception as e:
        logger.error(f"!!! ERROR TABLA !!!: {e}")
        traceback.print_exc()
        raise e
    finally:
        if conn: conn.close()


# ----------------- KPIs -----------------

def calcular_kpis(filtros: "VentasProductoFiltros") -> Dict[str, Any]:
    conn = None
    try:
        where_sql, params = _build_filtros_where(
            filtros.sucursal, filtros.producto, filtros.fecha_desde, 
            filtros.fecha_hasta, filtros.mes, filtros.anio
        )

        sql_totales = f"SELECT COUNT(*), ISNULL(SUM(Total), 0), ISNULL(SUM(cantidad), 0) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}"
        sql_distinct = f"SELECT COUNT(DISTINCT id_pro) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}"
        sql_top = f"SELECT TOP 1 CNOMBREALMACEN, SUM(Total) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql} GROUP BY CNOMBREALMACEN ORDER BY 2 DESC"

        conn = get_connection()
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
    except Exception as e:
        logger.error(f"KPI ERROR: {e}")
        return {"total_vendido": 0, "unidades_vendidas": 0, "productos_distintos": 0}
    finally:
        if conn: conn.close()


# ----------------- CATÁLOGOS -----------------

def obtener_sucursales() -> List[str]:
    conn = None
    try:
        sql = "SELECT nombre FROM zz_SucursalesReporte WITH (NOLOCK) ORDER BY nombre"
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(sql)
        return [r[0] for r in cur.fetchall()]
    except Exception as e:
        return []
    finally:
        if conn: conn.close()


def obtener_productos(q: Optional[str] = None, top: int = 50) -> List[Dict[str, Any]]:
    conn = None
    try:
        top = max(1, min(int(top), 200))
        sql = f"SELECT TOP {top} CIDPRODUCTO, CCODIGOPRODUCTO, CNOMBREPRODUCTO FROM admProductos WITH (NOLOCK) WHERE CIDPRODUCTO <> 0"
        params = []

        if q:
            sql += " AND (CCODIGOPRODUCTO LIKE ? OR CNOMBREPRODUCTO LIKE ?)"
            like = f"%{q}%"
            params.extend([like, like])

        sql += " ORDER BY CCODIGOPRODUCTO"

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()

        return [{"id_pro": int(r[0]), "codigo": r[1], "nombre": r[2]} for r in rows]
    except Exception as e:
        return []
    finally:
        if conn: conn.close()


# ----------------- Otros Reportes -----------------

def resumen_por_sucursal_mes_actual(mes: Optional[int] = None, anio: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = None
    try:
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
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(sql, [anio, mes])
        rows = cur.fetchall()
        return [{"sucursal": r[0], "total_vendido": float(r[1])} for r in rows]
    except Exception:
        return []
    finally:
        if conn: conn.close()

# ----------------- Exportación Excel (OPTIMIZADA) -----------------

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
    conn = None
    try:
        logger.info("--- [EXPORT] Iniciando exportación Excel ---")
        
        where_sql, params = _build_filtros_where(
            sucursal=sucursal, producto=producto, fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta, mes=mes, anio=anio
        )

        # CAMBIO: Agregamos 'hora' al SELECT para que el generador de Excel no falle
        sql = f"""
            SELECT
                fecha, Mes, hora, id_pro, CCODIGOPRODUCTO, CNOMBREPRODUCTO,
                cantidad, CNOMBREUNIDAD, precio, Importe, descuento,
                impuesto, Total, CNOMBREALMACEN
            FROM zzVentasPorProducto WITH (NOLOCK)
            {where_sql}
            ORDER BY id_pro
        """

        conn = get_connection()
        cur = conn.cursor()
        
        logger.info("--- [EXPORT] Ejecutando Query... ---")
        cur.execute(sql, params)
        rows = cur.fetchall()
        logger.info(f"--- [EXPORT] Query finalizado. {len(rows)} filas encontradas. Generando archivo... ---")

        items = []
        for r in rows:
            items.append({
                "fecha": str(r[0]) if r[0] else "", 
                "Mes": r[1],
                "hora": str(r[2]) if r[2] else "",  # <--- ¡AQUÍ ESTABA EL FALTANTE!
                "id_pro": int(r[3]),
                "CCODIGOPRODUCTO": r[4],
                "CNOMBREPRODUCTO": r[5],
                "cantidad": float(r[6]),
                "CNOMBREUNIDAD": r[7],
                "precio": float(r[8]),
                "Importe": float(r[9]),
                "descuento": float(r[10]),
                "impuesto": float(r[11]),
                "Total": float(r[12]),
                "CNOMBREALMACEN": r[13],
            })
        
        # Textos del encabezado
        sucursal_texto = sucursal if sucursal else "TODAS LAS SUCURSALES"
        meses_nombres = ["", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
                        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]
        
        periodo_texto = ""
        if mes and anio: periodo_texto = f"{meses_nombres[int(mes)]} {anio}"
        elif mes: periodo_texto = f"{meses_nombres[int(mes)]}"
        elif anio: periodo_texto = f"DEL AÑO {anio}"
        elif fecha_desde and fecha_hasta: periodo_texto = f"DEL {fecha_desde} AL {fecha_hasta}"
        else: periodo_texto = "HISTÓRICO GENERAL"
        
        return generar_excel_ventas_producto(items, sucursal_texto, periodo_texto)
    finally:
        if conn: conn.close()

# Placeholders
def ventas_por_sucursal(**kwargs): return []
def top_productos(**kwargs): return []
def timeline_ventas(**kwargs): return []