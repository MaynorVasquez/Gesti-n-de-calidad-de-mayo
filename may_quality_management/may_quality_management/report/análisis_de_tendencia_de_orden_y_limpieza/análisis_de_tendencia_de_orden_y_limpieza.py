# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe import _
from frappe.utils import flt

def execute(filters=None):
    # Si no hay filtros, inicializamos como un diccionario vacío para evitar errores
    if not filters:
        filters = {}

    columns = get_columns()
    data = get_data(filters)
    # Preparamos los datos del gráfico
    chart = get_chart_data(data)
    return columns, data, None, None

def get_chart_data(data):
    if not data:
        return None

    # Agrupamos resultados por departamento
    dept_map = {}
    for d in data:
        dept = d.get("departamento") or _("Sin Departamento")
        if dept not in dept_map:
            dept_map[dept] = []
        dept_map[dept].append(flt(d.get("resultado")))

    labels = []
    values = []

    for dept, resultados in dept_map.items():
        labels.append(dept)
        # Calculamos el promedio del departamento
        promedio = sum(resultados) / len(resultados)
        values.append(promedio)

    return {
        "data": {
            "labels": labels,
            "datasets": [
                {
                    "name": _("Promedio de Resultado"),
                    "values": values
                }
            ]
        },
        "type": "bar",
        "colors": ["#5e64ff"]
    }



def get_columns():
    return [
        {"label": _("Formulario"), "fieldname": "name", "fieldtype": "Link", "options": "QC Orden y Limpieza", "width": 200},
        {"label": _("Supervisor"), "fieldname": "full_user_name", "fieldtype": "Data", "width": 150},
        {"label": _("Fecha Inspección"), "fieldname": "fecha_inspeccion", "fieldtype": "Date", "width": 150},
        {"label": _("Hora"), "fieldname": "hora_inspeccion", "fieldtype": "Time", "width": 100},
        {"label": _("Departamento"), "fieldname": "departamento", "fieldtype": "Data", "width": 200},
        {"label": _("Área de Inspección"), "fieldname": "area", "fieldtype": "Data", "width": 300},
        {"label": _("OR Resultado"), "fieldname": "or_resultado", "fieldtype": "Int", "width": 120},
        {"label": _("PPT Resultado"), "fieldname": "ppt_resultado", "fieldtype": "Int", "width": 120},
        {"label": _("EU Resultado"), "fieldname": "eu_resultado", "fieldtype": "Int", "width": 120},
        {"label": _("ELM Resultado"), "fieldname": "elm_resultado", "fieldtype": "Int", "width": 120},
        {"label": _("BS Resultado"), "fieldname": "bs_resultado", "fieldtype": "Int", "width": 120},
        {"label": _("EP Resultado"), "fieldname": "ep_resultado", "fieldtype": "Int", "width": 120},
        {"label": _("Resultado Área"), "fieldname": "resultado", "fieldtype": "Int", "width": 120},
        {"label": _("Total General"), "fieldname": "total", "fieldtype": "Int", "width": 120}
    ]

def get_data(filters):
    conditions = ["1=1"]
    
    if filters.get("fecha_inicio"):
        conditions.append("T0.fecha_inspeccion >= %(fecha_inicio)s")
        
    if filters.get("fecha_fin"):
        conditions.append("T0.fecha_inspeccion <= %(fecha_fin)s")
    
    # 3. Filtro de Área (en la tabla de detalle T1)
    if filters.get("area"):
        conditions.append("T1.area = %(area)s")
        
    # 3. Filtro de Área (en la tabla de detalle T1)
    if filters.get("departamento"):
        conditions.append("T1.departamento = %(departamento)s")

    where_clause = " AND ".join(conditions)

    # Nota: Agregamos T0. a las fechas en las condiciones para evitar ambigüedad
    return frappe.db.sql(f"""
        SELECT 
            T0.name,
            T0.fecha_inspeccion,
            T0.hora_inspeccion,
            T0.total,
            T1.departamento,
            T1.area,
            T1.or_resultado,
            T1.ppt_resultado,
            T1.eu_resultado,
            T1.elm_resultado,
            T1.bs_resultado,
            T1.ep_resultado,
            T1.resultado,
            T0.full_user_name
        FROM `tabQC Orden y Limpieza` T0 
        INNER JOIN `tabQC Orden y Limpieza Detalle` T1 ON T0.name = T1.parent
        WHERE {where_clause}
        ORDER BY T0.fecha_inspeccion ASC, T0.hora_inspeccion ASC
    """, filters, as_dict=1)