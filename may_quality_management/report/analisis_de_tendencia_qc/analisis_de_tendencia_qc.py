import frappe
from frappe import _

def execute(filters=None):
    if not filters: filters = {}
    
    columns = get_columns()
    data = get_data(filters)
    
    # Aquí preparamos la estructura para que el Frontend sepa qué gráficas dibujar
    chart = get_chart_data(data)

    return columns, data, None, chart

def get_columns():
    return [
        {"label": _("Fecha"), "fieldname": "fecha", "fieldtype": "Datetime", "width": 160},
        {"label": _("Parámetro"), "fieldname": "parametro", "fieldtype": "Data", "width": 140},
        {"label": _("Resultado"), "fieldname": "resultado", "fieldtype": "Float", "width": 100},
        {"label": _("Muestra"), "fieldname": "parent", "fieldtype": "Dynamic Link", "options": "doctype", "width": 120}
    ]

def get_data(filters):
    # Traemos los datos de la tabla hija (Detalle) filtrando por el campo del padre
    return frappe.db.sql("""
        SELECT 
            d.creation as fecha, d.parametro, d.resultados as resultado, d.parent
        FROM 
            `tabQC Muestra Detalle` d
        INNER JOIN 
            `tabQC Producto Muestra` p ON d.parent = p.name
        WHERE 
            p.qc_producto = %(qc_producto)s
            AND d.tipo_parametro = 'Número'
        ORDER BY 
            d.creation ASC
    """, filters, as_dict=1)

def get_chart_data(data):
    if not data:
        return None

    # Agrupamos resultados por parámetro
    parametros_dict = {}
    for d in data:
        if d.parametro not in parametros_dict:
            parametros_dict[d.parametro] = {"labels": [], "values": []}
        
        parametros_dict[d.parametro]["labels"].append(frappe.utils.format_datetime(d.fecha, "dd/mm/yy HH:mm"))
        parametros_dict[d.parametro]["values"].append(d.resultado)

    # Devolvemos un objeto organizado para JS
    return {
        "is_dynamic": True,
        "summary": parametros_dict
    }