// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt

frappe.query_reports["QC Producto Script Report"] = {
	"filters": [
		{
			"fieldname": "name",
			"label": __("Formulario control de calidad"),
			"fieldtype": "Link",
			"options": "QC Producto"
		},
		{
			"fieldname": "fecha_inicio",
			"label": __("Fecha de Inicio"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_start()
		},
		{
			"fieldname": "fecha_fin",
			"label": __("Fecha de Fin"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_end()
		}

	]
};
