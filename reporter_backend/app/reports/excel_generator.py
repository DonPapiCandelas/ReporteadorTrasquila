from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from typing import List, Dict, Any
from io import BytesIO
from datetime import datetime

# Colores aproximados de la imagen
COLOR_HEADER_ORANGE = "FF6600"
COLOR_SUBHEADER_GREEN = "006633"
COLOR_TABLE_HEADER_ORANGE = "FF9900"
COLOR_TOTAL_BLUE = "0070C0"
COLOR_WHITE = "FFFFFF"

def generar_excel_ventas_producto(items: List[Dict[str, Any]], filtros_info: str) -> BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "Reporte Ventas"

    # Estilos
    font_white_bold = Font(color=COLOR_WHITE, bold=True, size=12)
    font_header_table = Font(color=COLOR_WHITE, bold=True, size=11)
    font_bold = Font(bold=True)
    
    fill_orange = PatternFill(start_color=COLOR_HEADER_ORANGE, end_color=COLOR_HEADER_ORANGE, fill_type="solid")
    fill_green = PatternFill(start_color=COLOR_SUBHEADER_GREEN, end_color=COLOR_SUBHEADER_GREEN, fill_type="solid")
    fill_table_header = PatternFill(start_color=COLOR_TABLE_HEADER_ORANGE, end_color=COLOR_TABLE_HEADER_ORANGE, fill_type="solid")
    fill_total = PatternFill(start_color=COLOR_TOTAL_BLUE, end_color=COLOR_TOTAL_BLUE, fill_type="solid")

    border_thin = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

    # --- Encabezados Principales ---
    # Fila 1: Nombre Empresa (Simulado)
    ws.merge_cells('A1:I1')
    cell_a1 = ws['A1']
    cell_a1.value = "COMERCIALIZADORA LA TRASQUILA SA DE CV"
    cell_a1.font = font_white_bold
    cell_a1.fill = fill_orange
    cell_a1.alignment = Alignment(horizontal='left', vertical='center')

    # Fila 2: RFC (Simulado)
    ws.merge_cells('A2:I2')
    cell_a2 = ws['A2']
    cell_a2.value = "RFC: CTR2506114T9"
    cell_a2.font = font_white_bold
    cell_a2.fill = fill_orange
    cell_a2.alignment = Alignment(horizontal='left', vertical='center')

    # Fila 3: Sucursal (Del filtro o general)
    ws.merge_cells('A3:I3')
    cell_a3 = ws['A3']
    cell_a3.value = f"SUCURSAL: {filtros_info}"
    cell_a3.font = font_white_bold
    cell_a3.fill = fill_green
    cell_a3.alignment = Alignment(horizontal='left', vertical='center')

    # Fila 4: Título Reporte
    ws.merge_cells('A4:I4')
    cell_a4 = ws['A4']
    cell_a4.value = f"REPORTE DE VENTA POR PRODUCTO - GENERADO EL {datetime.now().strftime('%d/%m/%Y')}"
    cell_a4.font = font_white_bold
    cell_a4.fill = fill_green
    cell_a4.alignment = Alignment(horizontal='left', vertical='center')

    # Espacio
    ws.append([])

    # --- Encabezados Tabla ---
    headers = [
        "Código", "Producto", "Cantidad", "Unidad", "Precio", 
        "Importe", "Descuento", "Impuesto", "Total"
    ]
    ws.append(headers)
    
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=6, column=col_num)
        cell.font = font_header_table
        cell.fill = fill_table_header
        cell.alignment = Alignment(horizontal='center')
        cell.border = border_thin

    # --- Datos ---
    row_idx = 7
    total_cantidad = 0.0
    total_importe = 0.0
    total_descuento = 0.0
    total_impuesto = 0.0
    total_general = 0.0

    for item in items:
        ws.cell(row=row_idx, column=1, value=item.get("CCODIGOPRODUCTO")).border = border_thin
        ws.cell(row=row_idx, column=2, value=item.get("CNOMBREPRODUCTO")).border = border_thin
        
        cant = float(item.get("cantidad", 0))
        ws.cell(row=row_idx, column=3, value=cant).border = border_thin
        
        ws.cell(row=row_idx, column=4, value=item.get("CNOMBREUNIDAD")).border = border_thin
        
        precio = float(item.get("precio", 0))
        ws.cell(row=row_idx, column=5, value=precio).number_format = '$#,##0.00'
        ws.cell(row=row_idx, column=5).border = border_thin

        importe = float(item.get("Importe", 0))
        ws.cell(row=row_idx, column=6, value=importe).number_format = '$#,##0.00'
        ws.cell(row=row_idx, column=6).border = border_thin

        desc = float(item.get("descuento", 0))
        ws.cell(row=row_idx, column=7, value=desc).number_format = '$#,##0.00'
        ws.cell(row=row_idx, column=7).border = border_thin

        imp = float(item.get("impuesto", 0))
        ws.cell(row=row_idx, column=8, value=imp).number_format = '$#,##0.00'
        ws.cell(row=row_idx, column=8).border = border_thin

        tot = float(item.get("Total", 0))
        ws.cell(row=row_idx, column=9, value=tot).number_format = '$#,##0.00'
        ws.cell(row=row_idx, column=9).border = border_thin

        # Acumulados
        total_cantidad += cant
        total_importe += importe
        total_descuento += desc
        total_impuesto += imp
        total_general += tot

        row_idx += 1

    # --- Fila Total ---
    ws.merge_cells(f'A{row_idx}:B{row_idx}')
    cell_total_label = ws.cell(row=row_idx, column=1, value="Total General")
    cell_total_label.font = font_white_bold
    cell_total_label.fill = fill_total
    cell_total_label.alignment = Alignment(horizontal='center')
    # Aplicar estilo a la celda fusionada B también (aunque no tenga valor)
    ws.cell(row=row_idx, column=2).fill = fill_total
    ws.cell(row=row_idx, column=2).border = border_thin

    # Totales numéricos
    # Cantidad
    c_cant = ws.cell(row=row_idx, column=3, value=total_cantidad)
    c_cant.font = font_bold
    c_cant.number_format = '#,##0.00'
    c_cant.border = border_thin

    # Unidad (vacío)
    ws.cell(row=row_idx, column=4).border = border_thin

    # Precio (vacío)
    ws.cell(row=row_idx, column=5).border = border_thin

    # Importe
    c_imp = ws.cell(row=row_idx, column=6, value=total_importe)
    c_imp.font = font_bold
    c_imp.number_format = '$#,##0.00'
    c_imp.border = border_thin

    # Descuento
    c_desc = ws.cell(row=row_idx, column=7, value=total_descuento)
    c_desc.font = font_bold
    c_desc.number_format = '$#,##0.00'
    c_desc.border = border_thin

    # Impuesto
    c_impu = ws.cell(row=row_idx, column=8, value=total_impuesto)
    c_impu.font = font_bold
    c_impu.number_format = '$#,##0.00'
    c_impu.border = border_thin

    # Total Final
    c_tot = ws.cell(row=row_idx, column=9, value=total_general)
    c_tot.font = font_bold
    c_tot.number_format = '$#,##0.00'
    c_tot.border = border_thin

    # Ajustar anchos de columna
    column_widths = [15, 40, 10, 10, 12, 12, 12, 12, 15]
    for i, width in enumerate(column_widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = width

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output
