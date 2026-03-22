# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
    if not filters:
        filters = {}
    
    columns = get_columns()
    data = get_data(filters)
    return columns, data, None, None



def get_columns():
    return [
        {"label": _("Formulario"), "fieldname": "name", "fieldtype": "Data", "width": 250},
        {"label": _("Fecha de Inspección"), "fieldname": "fecha_inspeccion", "fieldtype": "Date", "width": 250},
        {"label": _("Hora Inspección"), "fieldname": "hora_inspeccion", "fieldtype": "Time", "width": 250},
        {"label": _("Código Empelado"), "fieldname": "codigo_empleado", "fieldtype": "Data", "width": 250},
        {"label": _("Código Interno"), "fieldname": "custom_codigo_interno", "fieldtype": "Data", "width": 100},
        {"label": _("Nombre Empleado"), "fieldname": "nombre_empleado", "fieldtype": "Data", "width": 300},
        {"label": _("Departamento"), "fieldname": "department", "fieldtype": "Data", "width": 250},
        {"label": _("área"), "fieldname": "area", "fieldtype": "Data", "width": 250},
        {"label": _("Genero"), "fieldname": "gender", "fieldtype": "Data", "width": 100},
        {"label": _("Estado"), "fieldname": "status", "fieldtype": "Data", "width": 100},
        {"label": _("Cumplimiento"), "fieldname": "cumplimiento", "fieldtype": "Data", "width": 100},
        {"label": _("Resultado ATP"), "fieldname": "atp_resultado", "fieldtype": "Int", "width": 100},
        
    ]

def get_data(filters):
    """Consulta SQL para obtener los datos de la base de datos"""
    
    # 1. Iniciamos con una condición siempre verdadera para evitar errores de sintaxis
    conditions = ["1=1"]
    
    
    if filters.get("fecha_inicio"):
        conditions.append("T0.fecha_inspeccion >= %(fecha_inicio)s")
        
    if filters.get("fecha_fin"):
        conditions.append("T0.fecha_inspeccion <= %(fecha_fin)s")
    
    # Si agregaste el filtro de 'parametro' que discutimos antes:
    #if filters.get("parametro"):
    #    conditions.append("T1.parametro = %(parametro)s")

    # 3. Unimos las condiciones con " AND "
    where_clause = " AND ".join(conditions)

    # 4. Ejecutamos la consulta usando format para la estructura y el segundo argumento para los valores
    return frappe.db.sql(f"""
		SELECT 
			T0.name,
			T0.fecha_inspeccion,
			T0.hora_inspeccion,
			T1.codigo_empleado,
			T1.nombre_empleado,
			T1.atp_resultado,
			T1.area,
            T1.cumplimiento,
			T2.custom_codigo_interno,
			T2.gender,
			T2.status,
			T2.department
		FROM `tabQC Lavado de Manos ATP` T0
		inner join `tabQC Lavado de Manos ATP Detalle` T1 on T0.name = T1.parent
		inner join tabEmployee T2 on T1.codigo_empleado = T2.name
        WHERE {where_clause}
        ORDER BY T0.fecha_inspeccion ASC, T0.hora_inspeccion ASC
    """, filters, as_dict=1)