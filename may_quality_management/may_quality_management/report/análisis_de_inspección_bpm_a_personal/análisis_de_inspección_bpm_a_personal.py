# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe
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
        {"label": _("Hora de Inspección"), "fieldname": "hora_inspeccion", "fieldtype": "Time", "width": 250},
        {"label": _("Supervisor"), "fieldname": "supervisor", "fieldtype": "Data", "width": 250},
        {"label": _("Manos Limpias"), "fieldname": "manos_limpias", "fieldtype": "Data", "width": 250},
        {"label": _("Uñas Limpias y Cortas"), "fieldname": "ulc", "fieldtype": "Data", "width": 250},
        {"label": _("Barba"), "fieldname": "barba", "fieldtype": "Data", "width": 250},
        {"label": _("Uniforme Limpio"), "fieldname": "uniforme_limpio", "fieldtype": "Data", "width": 250},
        {"label": _("Redecilla"), "fieldname": "redecilla", "fieldtype": "Data", "width": 250},
        {"label": _("Mascarilla"), "fieldname": "mascarilla", "fieldtype": "Data", "width": 250},
        {"label": _("Sim Maquillaje"), "fieldname": "maquillaje", "fieldtype": "Data", "width": 250},
        {"label": _("Sin Joyeria"), "fieldname": "joyeria", "fieldtype": "Data", "width": 250},
        {"label": _("Código Empleado"), "fieldname": "codigo_empleado", "fieldtype": "Data", "width": 250},
        {"label": _("Código FACTUS"), "fieldname": "custom_codigo_interno", "fieldtype": "Data", "width": 250},
        {"label": _("Nombre Empleado"), "fieldname": "employee_name", "fieldtype": "Data", "width": 250},
        {"label": _("Departamento"), "fieldname": "department", "fieldtype": "Data", "width": 250},
        {"label": _("Estado Empleado"), "fieldname": "status", "fieldtype": "Data", "width": 250},
        {"label": _("Genero"), "fieldname": "gender", "fieldtype": "Data", "width": 250},
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
			T0.supervisor,
			T1.manos_limpias,
			T1.ulc,
			T1.barba,
			T1.uniforme_limpio,
			T1.redecilla,
			T1.mascarilla,
			T1.maquillaje,
			T1.joyeria,
			T2.name as 'codigo_empleado',
			T2.custom_codigo_interno,
			T2.employee_name,
            T2.department,
			T2.status,
			T2.gender
		FROM `tabQC Inspeccion de Personal` T0 
		inner join `tabQC Inspeccion de Personal Detalle` T1 on T0.name = T1.parent
		inner join tabEmployee T2 on T1.codigo_empleado = T2.name
        WHERE {where_clause}
        ORDER BY T0.fecha_inspeccion ASC, T0.hora_inspeccion ASC
    """, filters, as_dict=1)
