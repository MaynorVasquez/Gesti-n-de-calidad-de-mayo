# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe import _
import json

def execute(filters=None):
    if not filters.get("producto"):
        return [], [], None, None

    columns = get_columns()
    # Obtenemos los datos (Asegúrate de traer valor_minimo y valor_maximo en tu SQL)
    data = get_data(filters)  
    chart_data = prepare_chart_data(data)

    return columns, data, None, chart_data

def prepare_chart_data(data):
    if not data:
        return None

    series = {}

    for d in data:
        parametro = d.get("parametro")
        if not parametro:
            continue

        if parametro not in series:
            series[parametro] = {
                "labels": [],
                "mins": [],
                "results": [],
                "maxs": []
            }

        fecha = frappe.utils.formatdate(d.get("docdate"), "dd/mm") if d.get("docdate") else ""
        hora = frappe.utils.format_time(d.get("hora_muestra"), "HH:mm") if d.get("hora_muestra") else ""
        etiqueta = f"{fecha} {hora}".strip()

        series[parametro]["labels"].append(etiqueta)
        # Asegúrate de que estos nombres coincidan con las columnas de tu SQL
        series[parametro]["results"].append(float(d.get("resultado") or 0))
        series[parametro]["mins"].append(float(d.get("valor_minimo") or 0))
        series[parametro]["maxs"].append(float(d.get("valor_maximo") or 0))
    return {
        "series": series
    }



def get_columns():
    return [
        {"label": _("Formulario"), "fieldname": "correlativo_qc_producto", "fieldtype": "Data", "width": 200},
        {"label": _("Fecha QC Producto"), "fieldname": "fecha_qc_producto", "fieldtype": "Date", "width": 110},
        {"label": _("Fecha Vencimiento"), "fieldname": "fecha_vencimiento", "fieldtype": "Date", "width": 110},
        {"label": _("ItemCode"), "fieldname": "qc_template", "fieldtype": "Data", "width": 100},
        {"label": _("ItemName"), "fieldname": "itemname", "fieldtype": "Data", "width": 300},
        {"label": _("Hora QC Producto"), "fieldname": "hora_qc_producto", "fieldtype": "Data", "width": 110},
        {"label": _("Vida Útil"), "fieldname": "vida_util", "fieldtype": "Data", "width": 110},
        {"label": _("Tiempo"), "fieldname": "tiempo", "fieldtype": "Data", "width": 80},
        {"label": _("Lote"), "fieldname": "batchnum", "fieldtype": "Data", "width": 110},
        {"label": _("Fecha Muesta"), "fieldname": "docdate", "fieldtype": "Date", "width": 110},
        {"label": _("Hora muestra"), "fieldname": "hora_muestra", "fieldtype": "Time", "width": 150},
        {"label": _("Parámetro"), "fieldname": "parametro", "fieldtype": "Data", "width": 250},
        {"label": _("Mín"), "fieldname": "valor_minimo", "fieldtype": "Float", "width": 80},
        {"label": _("Resultado"), "fieldname": "resultado", "fieldtype": "Float", "width": 100},
        {"label": _("Máx"), "fieldname": "valor_maximo", "fieldtype": "Float", "width": 80},
        {"label": _("Conformidad"), "fieldname": "conformidad", "fieldtype": "Data", "width": 120},
        {"label": _("Estatus"), "fieldname": "indicador_vial", "fieldtype": "Data", "width": 75},
    ]

def get_data(filters):
    """Consulta SQL para obtener los datos de la base de datos"""
    
    # 1. Iniciamos con una condición siempre verdadera para evitar errores de sintaxis
    conditions = ["1=1"]
    
    # 2. Construimos la lista de condiciones de forma dinámica
    if filters.get("producto"):
        conditions.append("T2.qc_template = %(producto)s")
    
    if filters.get("fecha_inicio"):
        conditions.append("T0.docdate >= %(fecha_inicio)s")
        
    if filters.get("fecha_fin"):
        conditions.append("T0.docdate <= %(fecha_fin)s")
    
    # Si agregaste el filtro de 'parametro' que discutimos antes:
    #if filters.get("parametro"):
    #    conditions.append("T1.parametro = %(parametro)s")

    # 3. Unimos las condiciones con " AND "
    where_clause = " AND ".join(conditions)

    # 4. Ejecutamos la consulta usando format para la estructura y el segundo argumento para los valores
    return frappe.db.sql(f"""
        SELECT 
            T0.docdate, 
            T0.hora_muestra,
            T1.parametro, 
            T1.resultados as resultado, 
            T1.valor_minimo, 
            T1.valor_maximo, 
            T1.indicador_vial,
            T1.tipo_parametro,
            T1.conformidad,
            T2.name as correlativo_qc_producto,
            T2.qc_template,
            T2.itemname,
            T2.vida_util,
            T2.docduedate as fecha_vencimiento,
            T2.docdate as fecha_qc_producto,
            T2.tiempo,
            T2.batchnum,
            T2.hora as hora_qc_producto
        FROM `tabQC Producto Muestra` T0
        INNER JOIN `tabQC Muestra Detalle` T1 ON T1.parent = T0.name
        INNER JOIN `tabQC Producto` T2 ON T2.name = T0.qc_producto
        WHERE {where_clause}
        ORDER BY T0.docdate ASC, T0.hora_muestra ASC
    """, filters, as_dict=1)