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
        {"label": _("Fecha de Inspección"), "fieldname": "fecha", "fieldtype": "Date", "width": 250},
        {"label": _("Hora de Inspección"), "fieldname": "hora", "fieldtype": "Time", "width": 250},
        {"label": _("Supervisor"), "fieldname": "supervisor", "fieldtype": "Data", "width": 250},
        {"label": _("Placa Vehículo"), "fieldname": "vehiculo", "fieldtype": "Data", "width": 250},
        {"label": _("Producto a transportar"), "fieldname": "tipo_producto", "fieldtype": "Data", "width": 250},
        {"label": _("Tipo de Vehículo"), "fieldname": "tipo_vehiculo", "fieldtype": "Data", "width": 250},
        {"label": _("Marchamo"), "fieldname": "marchamo", "fieldtype": "Data", "width": 250},
        {"label": _("Candado"), "fieldname": "candado", "fieldtype": "Data", "width": 250},
        {"label": _("Ubicación"), "fieldname": "ubicacion", "fieldtype": "Data", "width": 250},
        {"label": _("Transporte Subcontratado"), "fieldname": "transporte_subcontratado", "fieldtype": "Data", "width": 250},
        {"label": _("Supervisor"), "fieldname": "supervisor", "fieldtype": "Data", "width": 250},
        {"label": _("Piloto Subcontratado"), "fieldname": "nombre_piloto_subcontratado", "fieldtype": "Data", "width": 250},
        {"label": _("Placa Subcontratado"), "fieldname": "placa_subcontratado", "fieldtype": "Data", "width": 250},
        {"label": _("Parametro"), "fieldname": "parametro", "fieldtype": "Data", "width": 250},
        {"label": _("Criterio"), "fieldname": "criterio", "fieldtype": "Data", "width": 250},
        {"label": _("Cumplimiento"), "fieldname": "cumplimiento", "fieldtype": "Data", "width": 250},
        {"label": _("Thermo King"), "fieldname": "thermo_king", "fieldtype": "Data", "width": 250},
        {"label": _("Temperatura Producto"), "fieldname": "temperatura_producto", "fieldtype": "Data", "width": 250},
        {"label": _("Valor Mínimo"), "fieldname": "valor_minimo", "fieldtype": "Data", "width": 250},
        {"label": _("Valor Máximo"), "fieldname": "valor_maximo", "fieldtype": "Data", "width": 250},
        {"label": _("Resultado"), "fieldname": "resultados", "fieldtype": "Data", "width": 250},


        {"label": _("Observaciones"), "fieldname": "observaciones", "fieldtype": "Data", "width": 250},
        
        
        {"label": _("Código Empleado"), "fieldname": "codigo_empleado", "fieldtype": "Data", "width": 250},
        {"label": _("Código FACTUS"), "fieldname": "custom_codigo_interno", "fieldtype": "Data", "width": 250},
        {"label": _("Nombre Empleado"), "fieldname": "employee_name", "fieldtype": "Data", "width": 250},
        {"label": _("Departamento"), "fieldname": "department", "fieldtype": "Data", "width": 250},
        {"label": _("Estado Empleado"), "fieldname": "status", "fieldtype": "Data", "width": 250},
        {"label": _("Genero"), "fieldname": "gender", "fieldtype": "Data", "width": 250},
        {"label": _("Indicador"), "fieldname": "indicador_vial", "fieldtype": "Data", "width": 250},

    ]

def get_data(filters):
    """Consulta SQL para obtener los datos de la base de datos"""
    
    # 1. Iniciamos con una condición siempre verdadera para evitar errores de sintaxis
    conditions = ["1=1"]
    
    
    if filters.get("fecha_inicio"):
        conditions.append("T0.fecha >= %(fecha_inicio)s")
        
    if filters.get("fecha_fin"):
        conditions.append("T0.fecha <= %(fecha_fin)s")

    if filters.get("parametro"):
        conditions.append("T1.parametro IN %(parametro)s")

    if filters.get("placa_vehiculo"):
        conditions.append("T0.vehiculo IN %(placa_vehiculo)s")
    
    # Si agregaste el filtro de 'parametro' que discutimos antes:
    #if filters.get("parametro"):
    #    conditions.append("T1.parametro = %(parametro)s")

    # 3. Unimos las condiciones con " AND "
    where_clause = " AND ".join(conditions)

    # 4. Ejecutamos la consulta usando format para la estructura y el segundo argumento para los valores
    return frappe.db.sql(f"""
		SELECT 
			T0.name,
			T0.fecha,
			T0.hora,
			T0.supervisor,
            T0.vehiculo,
            T0.tipo_producto,
            T0.tipo_vehiculo,
            T0.marchamo,
            T0.candado,
            T0.ubicacion,
            T0.transporte_subcontratado,
            T0.nombre_piloto_subcontratado,
            T0.placa_subcontratado,
            T0.cumplimiento_general,
            T0.thermo_king,
            T0.temperatura_producto,
            T1.parametro,
            T1.criterio,
            T1.cumplimiento,
            T1.indicador_vial,
            T1.valor_minimo,
            T1.valor_maximo,
            T1.resultados,
            T1.observaciones,
			T2.name as 'codigo_empleado',
			T2.custom_codigo_interno,
			T2.employee_name,
            T2.department,
			T2.status,
			T2.gender
		FROM `tabQC Inspeccion y Liberacion de Vehiculos` T0 
		inner join `tabQC Inspeccion y Liberacion detalle` T1 on T0.name = T1.parent
		inner join tabEmployee T2 on T0.codigo_empleado = T2.name
        WHERE {where_clause}
        ORDER BY T0.fecha ASC, T0.hora ASC
    """, filters, as_dict=1)