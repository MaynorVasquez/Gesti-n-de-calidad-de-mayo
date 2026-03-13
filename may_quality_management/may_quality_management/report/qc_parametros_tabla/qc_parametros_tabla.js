// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt

frappe.query_reports["QC Parametros tabla"] = {
	"filters": [
		{
			"fieldname": "categoria",
			"label": __("Nombre de categoria"),
			"fieldtype": "Link",
			"options": "QC Categoria"
		}
	]
};
