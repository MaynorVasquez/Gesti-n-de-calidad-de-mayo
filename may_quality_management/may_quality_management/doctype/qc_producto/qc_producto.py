# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe import _
from frappe.model.document import Document

class QCProducto(Document):

    def before_submit(self):
        if self.status == "Cerrado":
            muestras_borrador = frappe.db.exists(
                "QC Producto Muestra",
                {
                    "qc_producto": self.name,
                    "docstatus": 0
                }
            )
            if muestras_borrador:
                frappe.throw(
                    "No se puede cerrar el Control de Calidad porque existen muestras en estado Borrador."
                )

    # Añadimos whitelist para que el método sea accesible de forma segura
    @frappe.whitelist()
    def obtener_resumen_muestras(self):
        return frappe.db.sql("""
            SELECT
                d.categoria,
                d.parametro,
                d.valor_minimo, 
                d.valor_maximo,
                d.tipo_parametro,
                d.conformidad,
                AVG(CAST(d.resultados AS DECIMAL(18,4))) as promedio
            FROM `tabQC Producto Muestra` p
            INNER JOIN `tabQC Muestra Detalle` d ON d.parent = p.name
            WHERE p.qc_producto IN (

                SELECT %s

                UNION

                SELECT formulario_base
                FROM `tabQC Producto Base`
                WHERE parent = %s

            )

            GROUP BY 
                d.categoria, 
                d.parametro,
                d.valor_minimo, 
                d.valor_maximo,
                d.tipo_parametro,
                d.conformidad
        """, (self.name, self.name), as_dict=1)