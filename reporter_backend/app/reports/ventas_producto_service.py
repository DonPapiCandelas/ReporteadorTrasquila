from typing import Any, Dict, List, Optional, Tuple
from datetime import date, datetime, timedelta
import logging
import traceback

from app.core.database import get_connection
from app.schemas.reports import VentasProductoFiltros

# Configuración de Bitácora
logger = logging.getLogger("uvicorn.error")

# ----------------- Helper para filtros (Versión Híbrida) -----------------

def _build_filtros_where(
    sucursal: Optional[str] = None,
    producto: Optional[str] = None,
    fecha_desde: Optional[Any] = None,
    fecha_hasta: Optional[Any] = None,
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    es_vista_resumen: bool = False 
) -> Tuple[str, List[Any]]:
    
    filtros = ["1=1"]
    params: List[Any] = []

    col_sucursal = "sucursal" if es_vista_resumen else "CNOMBREALMACEN"
    
    if sucursal:
        filtros.append(f"LTRIM(RTRIM({col_sucursal})) = ?")
        params.append(sucursal.strip())

    if producto and not es_vista_resumen:
        filtros.append("(CCODIGOPRODUCTO LIKE ? OR CNOMBREPRODUCTO LIKE ?)")
        like = f"%{producto}%"
        params.extend([like, like])

    usando_rango = False

    if fecha_desde:
        usando_rango = True
        filtros.append("fecha >= ?")
        if isinstance(fecha_desde, str):
            fecha_desde = datetime.strptime(fecha_desde, "%Y-%m-%d").date()
        params.append(fecha_desde)

    if fecha_hasta:
        usando_rango = True
        filtros.append("fecha < ?")
        if isinstance(fecha_hasta, str):
            fecha_hasta = datetime.strptime(fecha_hasta, "%Y-%m-%d").date()
        fecha_fin_corte = fecha_hasta + timedelta(days=1)
        params.append(fecha_fin_corte)

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


# ----------------- Listado (PANTALLA DETALLES) -----------------

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

    page = max(page, 1)
    page_size = max(1, min(page_size, 500))
    offset = (page - 1) * page_size

    where_sql, params = _build_filtros_where(
        sucursal, producto, fecha_desde, fecha_hasta, mes, anio, es_vista_resumen=False
    )

    sql_count = f"SELECT COUNT(1) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql} OPTION (RECOMPILE);"

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
        
        items: List[Dict[str, Any]] = []
        for r in rows:
            items.append({
                "fecha": str(r[0]) if r[0] else "", 
                "Mes": str(r[1]) if r[1] is not None else "",
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
                "Folio": "" 
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


# ----------------- KPIs MEJORADOS (INTELIGENTES) -----------------

def calcular_kpis(filtros: "VentasProductoFiltros") -> Dict[str, Any]:
    conn = None
    try:
        usar_vista_resumen = (filtros.producto is None or filtros.producto.strip() == "")
        
        conn = get_connection()
        cur = conn.cursor()

        total_vendido = 0.0
        unidades = 0.0
        tickets_unicos = 0
        ticket_promedio = 0.0
        distintos_prods = 0
        top_suc = (None, None)

        if usar_vista_resumen:
            # VISTA RÁPIDA
            where_sql, params = _build_filtros_where(
                filtros.sucursal, None, filtros.fecha_desde, 
                filtros.fecha_hasta, filtros.mes, filtros.anio, 
                es_vista_resumen=True
            )
            
            sql_totales = f"""
                SELECT COUNT(*), ISNULL(SUM(total_venta), 0)
                FROM zzVentasResumen WITH (NOLOCK) 
                {where_sql}
            """
            cur.execute(sql_totales, params)
            row = cur.fetchone()
            tickets_unicos = int(row[0]) if row else 0
            total_vendido = float(row[1]) if row else 0.0

            # Unidades (Pesado)
            where_sql_pesado, params_pesado = _build_filtros_where(
                filtros.sucursal, filtros.producto, filtros.fecha_desde, 
                filtros.fecha_hasta, filtros.mes, filtros.anio, 
                es_vista_resumen=False
            )
            sql_unidades = f"""
                SELECT ISNULL(SUM(cantidad), 0), COUNT(DISTINCT id_pro)
                FROM zzVentasPorProducto WITH (NOLOCK)
                {where_sql_pesado}
            """
            cur.execute(sql_unidades, params_pesado)
            row_u = cur.fetchone()
            unidades = float(row_u[0]) if row_u else 0.0
            distintos_prods = int(row_u[1]) if row_u else 0

            # Top Sucursal
            sql_top = f"""
                SELECT TOP 1 sucursal, SUM(total_venta) 
                FROM zzVentasResumen WITH (NOLOCK) 
                {where_sql} 
                GROUP BY sucursal 
                ORDER BY 2 DESC
            """
            cur.execute(sql_top, params)
            row_t = cur.fetchone()
            top_suc = (row_t[0], float(row_t[1])) if row_t else (None, None)

        else:
            # VISTA LENTA
            where_sql, params = _build_filtros_where(
                filtros.sucursal, filtros.producto, filtros.fecha_desde, 
                filtros.fecha_hasta, filtros.mes, filtros.anio, 
                es_vista_resumen=False
            )

            sql_totales = f"""
                SELECT COUNT(DISTINCT id_venta), ISNULL(SUM(Total), 0), ISNULL(SUM(cantidad), 0)
                FROM zzVentasPorProducto WITH (NOLOCK) 
                {where_sql}
            """
            cur.execute(sql_totales, params)
            row = cur.fetchone()
            tickets_unicos = int(row[0]) if row else 0
            total_vendido = float(row[1]) if row else 0.0
            unidades = float(row[2]) if row else 0.0

            sql_distinct = f"SELECT COUNT(DISTINCT id_pro) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql}"
            cur.execute(sql_distinct, params)
            row_d = cur.fetchone()
            distintos_prods = int(row_d[0]) if row_d else 0

            sql_top = f"SELECT TOP 1 CNOMBREALMACEN, SUM(Total) FROM zzVentasPorProducto WITH (NOLOCK) {where_sql} GROUP BY CNOMBREALMACEN ORDER BY 2 DESC"
            cur.execute(sql_top, params)
            row_t = cur.fetchone()
            top_suc = (row_t[0], float(row_t[1])) if row_t else (None, None)

        if tickets_unicos > 0:
            ticket_promedio = total_vendido / tickets_unicos
        
        return {
            "total_vendido": total_vendido,
            "unidades_vendidas": unidades,
            "productos_distintos": distintos_prods,
            "ticket_promedio": ticket_promedio,
            "sucursal_top": top_suc[0],
            "sucursal_top_total": top_suc[1],
        }

    except Exception as e:
        logger.error(f"KPI ERROR: {e}")
        return {"total_vendido": 0, "unidades_vendidas": 0, "productos_distintos": 0, "ticket_promedio": 0}
    finally:
        if conn: conn.close()


# ----------------- GRÁFICA: HORAS PICO -----------------

def obtener_ventas_por_hora(filtros: "VentasProductoFiltros") -> List[Dict[str, Any]]:
    conn = None
    try:
        usar_vista_resumen = (filtros.producto is None or filtros.producto.strip() == "")
        resultados = []
        conn = get_connection()
        cur = conn.cursor()

        if usar_vista_resumen:
            where_sql, params = _build_filtros_where(
                filtros.sucursal, None, filtros.fecha_desde, 
                filtros.fecha_hasta, filtros.mes, filtros.anio, 
                es_vista_resumen=True
            )
            sql = f"""
                SELECT DATEPART(HOUR, hora) as HoraDelDia, SUM(total_venta) as TotalVendido, COUNT(*) as NumTickets
                FROM zzVentasResumen WITH (NOLOCK)
                {where_sql}
                GROUP BY DATEPART(HOUR, hora)
                ORDER BY HoraDelDia
            """
        else:
            where_sql, params = _build_filtros_where(
                filtros.sucursal, filtros.producto, filtros.fecha_desde, 
                filtros.fecha_hasta, filtros.mes, filtros.anio, 
                es_vista_resumen=False
            )
            sql = f"""
                SELECT DATEPART(HOUR, hora) as HoraDelDia, SUM(Total) as TotalVendido, COUNT(DISTINCT id_venta) as NumTickets
                FROM zzVentasPorProducto WITH (NOLOCK)
                {where_sql}
                GROUP BY DATEPART(HOUR, hora)
                ORDER BY HoraDelDia
            """

        cur.execute(sql, params)
        rows = cur.fetchall()
        
        for r in rows:
            resultados.append({
                "hora": int(r[0]) if r[0] is not None else 0,
                "total_vendido": float(r[1]),
                "transacciones": int(r[2])
            })
            
        return resultados

    except Exception as e:
        logger.error(f"HORAS PICO ERROR: {e}")
        return []
    finally:
        if conn: conn.close()


# ----------------- TOP PRODUCTOS -----------------
def top_productos(filtros: "VentasProductoFiltros") -> List[Dict[str, Any]]:
    conn = None
    try:
        where_sql, params = _build_filtros_where(
            filtros.sucursal, None, filtros.fecha_desde, 
            filtros.fecha_hasta, filtros.mes, filtros.anio, 
            es_vista_resumen=False
        )
        sql = f"""
            SELECT TOP 10 CCODIGOPRODUCTO, CNOMBREPRODUCTO, SUM(Total) as TotalVendido, SUM(cantidad) as Unidades
            FROM zzVentasPorProducto WITH (NOLOCK)
            {where_sql}
            GROUP BY CCODIGOPRODUCTO, CNOMBREPRODUCTO
            ORDER BY TotalVendido DESC
        """
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(sql, params)
        rows = cur.fetchall()
        return [{"codigo": r[0], "producto": r[1], "total_vendido": float(r[2]), "cantidad_vendida": float(r[3])} for r in rows]
    except Exception as e:
        logger.error(f"TOP PRODUCTOS ERROR: {e}")
        return []
    finally:
        if conn: conn.close()


# ----------------- CATÁLOGOS Y EXPORTACIÓN -----------------

def obtener_sucursales() -> List[str]:
    conn = None
    try:
        sql = "SELECT nombre FROM zz_SucursalesReporte WITH (NOLOCK) ORDER BY nombre"
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(sql)
        return [r[0] for r in cur.fetchall()]
    except Exception:
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
    except Exception:
        return []
    finally:
        if conn: conn.close()

def resumen_por_sucursal_mes_actual(mes: Optional[int] = None, anio: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = None
    try:
        now = datetime.now()
        mes = mes or now.month
        anio = anio or now.year
        sql = """
            SELECT ISNULL(sucursal, 'SIN SUCURSAL'), ISNULL(SUM(total_venta), 0) 
            FROM zzVentasResumen WITH (NOLOCK) 
            WHERE YEAR(fecha) = ? AND MONTH(fecha) = ? 
            GROUP BY sucursal
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
        where_sql, params = _build_filtros_where(
            sucursal, producto, fecha_desde, fecha_hasta, mes, anio, es_vista_resumen=False
        )
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
        cur.execute(sql, params)
        rows = cur.fetchall()
        items = []
        for r in rows:
            items.append({
                "fecha": str(r[0]) if r[0] else "", 
                "Mes": str(r[1]) if r[1] is not None else "",
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
                "Folio": ""
            })
        
        sucursal_texto = sucursal if sucursal else "TODAS LAS SUCURSALES"
        meses = ["", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
                 "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]
        
        periodo = ""
        if mes and anio: periodo = f"{meses[int(mes)]} {anio}"
        elif mes: periodo = f"{meses[int(mes)]}"
        elif anio: periodo = f"DEL AÑO {anio}"
        elif fecha_desde and fecha_hasta: periodo = f"DEL {fecha_desde} AL {fecha_hasta}"
        else: periodo = "HISTÓRICO GENERAL"
        
        return generar_excel_ventas_producto(items, sucursal_texto, periodo)
    finally:
        if conn: conn.close()