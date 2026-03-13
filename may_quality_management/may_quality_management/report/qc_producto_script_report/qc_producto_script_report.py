# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe


# def execute(filters=None):
# 	columns, data = [], []
# 	return columns, data

import frappe
from frappe import _

def execute(filters=None):
    # 1. Definimos las columnas que verá el usuario
    columns = get_columns()
    
    # 2. Obtenemos los datos filtrados
    data = get_data(filters)

    # 3. Generamos la configuración de la gráfica
    chart = get_chart_data(data)
    message = _("Mostrando datos desde {} hasta {}. Limitado a las últimas 1000 filas.").format(filters.get("fecha_inicio"), filters.get("fecha_fin"))
    
    return columns, data, message, chart # El 4to elemento es el chart

def get_chart_data(data):
    if not data:
        return None

    # Contamos los estatus para la gráfica
    status_counts = {}
    for d in data:
        status = d.get("indicador_vial") or _("Sin definir")
        status_counts[status] = status_counts.get(status, 0) + 1

    labels = list(status_counts.keys())
    values = list(status_counts.values())

    return {
        "data": {
            "labels": labels,
            "datasets": [
                {
                    "name": _("Estatus de Calidad"),
                    "values": values
                }
            ]
        },
        "type": "pie", # Puedes cambiar a 'pie' o 'donut'
        "height": 280,
        "colors": ["#45f321", "#ff5858", "#ffa00a"] # Colores personalizados (verde, rojo, naranja)
    }

def get_columns():
    """Define los encabezados de la tabla"""
    return [
        {
            "label": _("Contol de Calidad"),
            "fieldname": "qc_producto",
            "fieldtype": "Link",
            "options": "QC Producto",
            "width": 150
        },
        {
            "label": _("Fecha control de calidad"),
            "fieldname": "fecha_qc_producto",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": _("Fecha de vencimiento"),
            "fieldname": "docduedate",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": _("Vida Util"),
            "fieldname": "vida_util",
            "fieldtype": "Int",
            "width": 150
        },
        {
            "label": _("Tiempo"),
            "fieldname": "tiempo",
            "fieldtype": "Data",
            "width": 110
        },
        {
            "label": _("Hora de arranque"),
            "fieldname": "hora_qc_producto",
            "fieldtype": "Time",
            "width": 110
        },
        {
            "label": _("Lote"),
            "fieldname": "batchnum",
            "fieldtype": "Data",
            "width": 110
        },
        {
            "label": _("ItemCode"),
            "fieldname": "itemcode",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("ItemName"),
            "fieldname": "itemname",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("ID Muestra"),
            "fieldname": "name",
            "fieldtype": "Link",
            "options": "QC Producto Muestra",
            "width": 120
        },
        {
            "label": _("Fecha muestra"),
            "fieldname": "fecha_muestra",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": _("Parámetro"),
            "fieldname": "parametro",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("Valor Mínimo"),
            "fieldname": "valor_minimo",
            "fieldtype": "Float",
            "width": 100
        },
        {
            "label": _("Valor Máximo"),
            "fieldname": "valor_maximo",
            "fieldtype": "Float",
            "width": 100
        },
        {
            "label": _("Resultado"),
            "fieldname": "resultado",
            "fieldtype": "Float",
            "width": 100
        },
        {
            "label": _("Conformidad"),
            "fieldname": "conformidad",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Estatus"),
            "fieldname": "indicador_vial",
            "fieldtype": "Data",
            "width": 120
        }
    ]

def get_data(filters):
    """Consulta SQL para obtener los datos de la base de datos"""
    conditions = ""
    # Aplicamos filtros dinámicos si el usuario los selecciona
    if filters.get("name"):
        conditions += " AND T0.qc_producto = %(name)s"
    
    # Nota: He usado 'p.creation' como fecha ya que 'docdate' suele ser un alias de creation
    if filters.get("fecha_inicio"):
        conditions += " AND T0.docdate >= %(fecha_inicio)s"
    if filters.get("fecha_fin"):
        conditions += " AND T0.docdate <= %(fecha_fin)s"

    limit = " LIMIT 1000"

    # Hacemos un JOIN entre el Padre (p) y el Detalle (d)
    return frappe.db.sql(f"""
        SELECT 
            T0.name, 
            T0.docdate as fecha_muestra, 
            T0.qc_producto,
            T0.itemcode,
            T0.itemname, 
            T1.parametro, 
            T1.resultados as resultado, 
            T1.indicador_vial,
            T1.valor_minimo,
            T1.valor_maximo,
            T1.conformidad,
            T2.vida_util,
            T2.docduedate,
            T2.docdate as fecha_qc_producto,
            T2.tiempo,
            T2.batchnum,
            T2.hora as hora_qc_producto            
        FROM 
            `tabQC Producto Muestra` T0
        INNER JOIN 
            `tabQC Muestra Detalle` T1 ON T1.parent = T0.name
        INNER JOIN 
            `tabQC Producto` T2 ON T2.name = T0.qc_producto
        WHERE 
            T0.docstatus < 2
            {conditions}
        ORDER BY 
            T0.name DESC
        {limit}
    """, filters, as_dict=1)