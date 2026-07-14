import frappe
from frappe.model.document import Document
from frappe import _

class QCProductoMuestra(Document):
    # def validate(self):
    #     # 1. Validar que el QC Producto padre esté abierto
    #     estado_padre = frappe.db.get_value("QC Producto", self.qc_producto, "status")
    #     if estado_padre == "Closed":
    #         frappe.throw(_("No se pueden agregar muestras. El QC Producto {0} está Cerrado").format(self.qc_producto))
    def validate(self):
        # Evitar ejecutar si no hay QC Producto
        if not self.qc_producto:
            return

        # Solo trabajar en borrador (opcional pero recomendado)
        if self.docstatus != 0:
            return

        self.sincronizar_plantilla()

    def sincronizar_plantilla(self):
        template_name = frappe.db.get_value("QC Producto", self.qc_producto, "qc_template")
        
        if not template_name:
            frappe.throw(_("El QC Producto seleccionado no tiene una plantilla asignada."))

        template_doc = frappe.get_doc("QC Template", template_name)

        # 🔹 Indexar registros existentes
        existentes = {}
        for row in self.detalle_resultados:
            key = (row.categoria, row.parametro)
            existentes[key] = row

        # 🔹 Recorrer plantilla
        for item in template_doc.items:
            key = (item.categoria, item.parametro)

            if key in existentes:
                # 🔄 UPDATE (solo campos técnicos)
                row = existentes[key]
                row.tipo_parametro = item.tipo_parametro
                row.valor_minimo = item.valor_minimo
                row.valor_maximo = item.valor_maximo
                row.tipo_ingreso = item.tipo_ingreso
                row.imprimir = item.imprimir

            else:
                # ➕ INSERT nuevo
                self.append("detalle_resultados", {
                    "categoria": item.categoria,
                    "parametro": item.parametro,
                    "tipo_parametro": item.tipo_parametro,
                    "valor_minimo": item.valor_minimo,
                    "valor_maximo": item.valor_maximo,
                    "tipo_ingreso": item.tipo_ingreso,
                    "imprimir": item.imprimir
                })

    def validar_estado_padre(self):
        if self.qc_producto:
            estado_padre = frappe.db.get_value("QC Producto", self.qc_producto, "status")
            
            if estado_padre != "Abierto":
                # Usando f-string directamente
                mensaje = f"No se puede registrar muestra de calidad. El control de calidad del producto {self.qc_producto} está en estado '{estado_padre}'."
                
                frappe.throw(
                    msg=mensaje,
                    title="Validación de Flujo"
                )
    

    def before_submit(self):

        VALIDATION_FIELDS = {
            #Tipo de campo : Valor que se debe de llenar
            "Número": "resultados",
            "Selección": "conformidad",
        }

        for row in self.detalle_resultados:

            # Solo validar obligatorios
            if row.tipo_ingreso != "Obligatorio":
                continue

            field_to_validate = VALIDATION_FIELDS.get(row.tipo_parametro)

            if not field_to_validate:
                continue

            value = row.get(field_to_validate)

            if not value:
                frappe.throw(
                    f"Debe completar el parámetro '{row.parametro}' en la fila {row.idx}"
                )
    