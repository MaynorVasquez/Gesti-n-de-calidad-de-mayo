# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe


import frappe
from frappe import _

def execute(filters=None):
    # 1. Definimos las columnas que verá el usuario
    columns = get_columns()
    
    # 2. Obtenemos los datos filtrados
    data = get_data(filters)
    
    return columns, data

def get_columns():
    """Define los encabezados de la tabla"""
    return [
        {
            "label": _("Categoria Parametro"),
            "fieldname": "categoria",
            "fieldtype": "Link",
            "options": "QC Categoria",
            "width": 150
        },
        {
            "label": _("Nombre Parametro"),
            "fieldname": "nombre",
            "fieldtype": "Data",
            "width": 150
        }
    ]

def get_data(filters):          
	
	return frappe.db.sql(f"""
        SELECT 
            p.categoria,
            p.nombre
        FROM 
            `tabQC Parametro` p

    """, filters, as_dict=1)