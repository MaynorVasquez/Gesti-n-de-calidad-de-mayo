# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document
from frappe import _

class QCParosdeProduccion(Document):
    def before_insert(self):
        # Llamamos a nuestra validación personalizada
        self.validar_estado_padre()

    def validar_estado_padre(self):
        if self.qc_producto:
            estado_padre = frappe.db.get_value("QC Producto", self.qc_producto, "status")
            
            if estado_padre != "Abierto":
                # Usando f-string directamente
                mensaje = f"No se puede registrar el paro. El control de calidad del producto {self.qc_producto} está en estado '{estado_padre}'."
                
                frappe.throw(
                    msg=mensaje,
                    title="Validación de Flujo"
                )