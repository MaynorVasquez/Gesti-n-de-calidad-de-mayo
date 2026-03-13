# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe

import frappe
from frappe import _
import json

def execute(filters=None):
    if not filters.get("qc_producto"):
        return [], [], None, None

    columns = get_columns()
    # Obtenemos los datos (Asegúrate de traer valor_minimo y valor_maximo en tu SQL)
    data = get_data(filters)  
    chart_data = prepare_chart_data(data)
    # frappe.log_error(
    #     title="DEBUG CHART DATA",
    #     message=json.dumps(chart_data, indent=2)
    # )

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
    # Tu consulta SQL que ya tienes, asegurándote de incluir d.valor_minimo y d.valor_maximo
    return frappe.db.sql("""
        SELECT 
            p.docdate, 
            p.hora_muestra,
        	d.parametro, 
            d.resultados as resultado, 
            d.valor_minimo, 
            d.valor_maximo, 
            d.indicador_vial,
            d.tipo_parametro,
            d.conformidad,
            T2.name as correlativo_qc_producto,
            T2.qc_template,
            T2.itemname,
            T2.vida_util,
            T2.docduedate as fecha_vencimiento,
            T2.docdate as fecha_qc_producto,
            T2.tiempo,
            T2.batchnum,
            T2.hora as hora_qc_producto
        FROM `tabQC Producto Muestra` p
        INNER JOIN `tabQC Muestra Detalle` d ON d.parent = p.name
        INNER JOIN `tabQC Producto` T2 ON T2.name = p.qc_producto
        WHERE p.qc_producto = %(qc_producto)s
        ORDER BY p.docdate ASC, p.hora_muestra ASC

    """, filters, as_dict=1)