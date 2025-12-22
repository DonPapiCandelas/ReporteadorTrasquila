import pyodbc
from typing import List, Optional, Tuple, Any, Dict
from app.core.database import get_connection
from app.schemas.tickets import TicketRow, TicketKpis, VentasPorAgenteItem

def _build_where_tickets(
    sucursal: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    semana: Optional[int] = None,
    anio: Optional[int] = None,
    mes: Optional[int] = None
) -> Tuple[str, List[Any]]:
    
    filtros = ["1=1"]
    params: List[Any] = []

    # Filtro Sucursal
    if sucursal and sucursal != "TODAS":
        filtros.append("dbo.admAlmacenes.CNOMBREALMACEN = ?")
        params.append(sucursal)

    # Lógica de fechas
    # Prioridad: Rango Exacto -> Semana/Año -> Mes/Año
    if fecha_inicio and fecha_fin:
        filtros.append("dbo.CSI_venta_PC.fecha BETWEEN ? AND ?")
        params.append(fecha_inicio)
        params.append(fecha_fin)
    elif semana and anio:
         # SQL Server DATEPART(week) depende de configuración, pero usaremos iso_week o similar si es necesario.
         # O mejor, filtramos por rango calculado en frontend.
         # ASUMIENDO QUE EL FRONTEND ENVÍA RANGOS DE FECHA INCLUSO PARA SEMANAS
         # Si llegan semana/anio, intentaremos usar DATEPART.
         filtros.append("DATEPART(iso_week, dbo.CSI_venta_PC.fecha) = ?")
         filtros.append("YEAR(dbo.CSI_venta_PC.fecha) = ?")
         params.append(semana)
         params.append(anio)
    elif mes and anio:
        filtros.append("MONTH(dbo.CSI_venta_PC.fecha) = ?")
        filtros.append("YEAR(dbo.CSI_venta_PC.fecha) = ?")
        params.append(mes)
        params.append(anio)
    elif anio:
        filtros.append("YEAR(dbo.CSI_venta_PC.fecha) = ?")
        params.append(anio)

    return " AND ".join(filtros), params

def listar_tickets(
    sucursal: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    semana: Optional[int] = None,
    anio: Optional[int] = None,
    mes: Optional[int] = None,
    page: int = 1,
    page_size: int = 50
) -> Dict[str, Any]:
    
    conn = get_connection()
    cursor = conn.cursor()

    where_clause, params = _build_where_tickets(sucursal, fecha_inicio, fecha_fin, semana, anio, mes)

    # Query Principal
    sql = f"""
        SELECT 
            dbo.CSI_venta_PC.id_venta, 
            ISNULL(dbo.admAgentes.CNOMBREAGENTE, 'Sin Agente') as CNOMBREAGENTE, 
            dbo.CSI_venta_PC.serie, 
            dbo.CSI_venta_PC.folio, 
            CONVERT(varchar, dbo.CSI_venta_PC.fecha, 23) as fecha, 
            CONVERT(varchar(5), dbo.CSI_venta_PC.hora, 108) as hora, 
            dbo.CSI_venta_PC.subtotal, 
            dbo.CSI_venta_PC.descuento, 
            dbo.CSI_venta_PC.impuesto, 
            dbo.CSI_venta_PC.total, 
            dbo.CSI_venta_PC.fEfectivo, 
            ISNULL(dbo.CSI_venta_PC.fDebito, 0) + ISNULL(dbo.CSI_venta_PC.fCredito, 0) AS Tarjeta, 
            dbo.CSI_venta_PC.fVales, 
            dbo.CSI_venta_PC.fTrans, 
            dbo.CSI_venta_PC.fOtro, 
            CONVERT(varchar, dbo.CSI_venta_PC.fechaCancelado, 23) as fechaCancelado, 
            CASE WHEN dbo.CSI_venta_PC.fechaCancelado IS NOT NULL THEN 'cancelado' ELSE 'cobrado' END AS cancelado, 
            dbo.admAlmacenes.CNOMBREALMACEN
        FROM dbo.CSI_venta_PC 
        LEFT OUTER JOIN dbo.admAlmacenes ON dbo.CSI_venta_PC.CIDALMACEN = dbo.admAlmacenes.CIDALMACEN 
        LEFT OUTER JOIN dbo.admAgentes ON dbo.CSI_venta_PC.id_agente = dbo.admAgentes.CIDAGENTE
        WHERE {where_clause}
        ORDER BY dbo.CSI_venta_PC.fecha DESC, dbo.CSI_venta_PC.hora DESC
        OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    """
    
    # KPIs Rápidos sobre el mismo set de filtros
    sql_kpis = f"""
        SELECT 
            SUM(CASE WHEN fechaCancelado IS NULL THEN total ELSE 0 END) as total_vendido,
            COUNT(*) as total_tickets,
            SUM(CASE WHEN fechaCancelado IS NOT NULL THEN 1 ELSE 0 END) as total_cancelados
        FROM dbo.CSI_venta_PC 
        LEFT OUTER JOIN dbo.admAlmacenes ON dbo.CSI_venta_PC.CIDALMACEN = dbo.admAlmacenes.CIDALMACEN 
        WHERE {where_clause}
    """

    # Ejecutar Main Query
    offset = (page - 1) * page_size
    full_params = params + [offset, page_size]
    
    cursor.execute(sql, full_params)
    columns = [column[0] for column in cursor.description]
    results = []
    for row in cursor.fetchall():
        results.append(dict(zip(columns, row)))

    # Ejecutar KPIs
    cursor.execute(sql_kpis, params)
    kpi_row = cursor.fetchone()
    
    total_vendido = kpi_row.total_vendido or 0
    total_tickets = kpi_row.total_tickets or 0
    total_cancelados = kpi_row.total_cancelados or 0
    promedio = total_vendido / total_tickets if total_tickets > 0 else 0

    conn.close()

    return {
        "data": results,
        "total": total_tickets, # Aproximación para paginación, o hacer count separado si se requiere exacto total rows query
        "page": page,
        "size": page_size,
        "kpis": {
            "total_vendido": total_vendido,
            "total_tickets": total_tickets,
            "total_cancelados": total_cancelados,
            "promedio_ticket": promedio
        }
    }

def obtener_ventas_por_agente(
    sucursal: Optional[str] = None,
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    semana: Optional[int] = None,
    anio: Optional[int] = None,
    mes: Optional[int] = None
) -> List[Dict[str, Any]]:
    
    conn = get_connection()
    cursor = conn.cursor()
    where_clause, params = _build_where_tickets(sucursal, fecha_inicio, fecha_fin, semana, anio, mes)

    sql = f"""
        SELECT 
            ISNULL(dbo.admAgentes.CNOMBREAGENTE, 'Sin Agente') as agente,
            SUM(dbo.CSI_venta_PC.total) as total,
            COUNT(*) as cantidad_tickets
        FROM dbo.CSI_venta_PC 
        LEFT OUTER JOIN dbo.admAlmacenes ON dbo.CSI_venta_PC.CIDALMACEN = dbo.admAlmacenes.CIDALMACEN 
        LEFT OUTER JOIN dbo.admAgentes ON dbo.CSI_venta_PC.id_agente = dbo.admAgentes.CIDAGENTE
        WHERE {where_clause} AND dbo.CSI_venta_PC.fechaCancelado IS NULL
        GROUP BY dbo.admAgentes.CNOMBREAGENTE
        ORDER BY total DESC
    """
    
    cursor.execute(sql, params)
    columns = [column[0] for column in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
    conn.close()
    return results
