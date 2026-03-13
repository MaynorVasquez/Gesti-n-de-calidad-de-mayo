import frappe
from frappe.model.document import Document
from frappe import _

class QCProductoMuestra(Document):
    # def validate(self):
    #     # 1. Validar que el QC Producto padre esté abierto
    #     estado_padre = frappe.db.get_value("QC Producto", self.qc_producto, "status")
    #     if estado_padre == "Closed":
    #         frappe.throw(_("No se pueden agregar muestras. El QC Producto {0} está Cerrado").format(self.qc_producto))

    def before_insert(self):

        self.validar_estado_padre()

        # 2. Cargar automáticamente las pruebas desde la plantilla del padre
        if not self.detalle_resultados:
            # Obtenemos el nombre de la plantilla desde el QC Producto
            template_name = frappe.db.get_value("QC Producto", self.qc_producto, "qc_template")
            
            if not template_name:
                frappe.throw(_("El QC Producto seleccionado no tiene una plantilla asignada."))

            # Traemos los items de la plantilla
            template_doc = frappe.get_doc("QC Template", template_name)

            for item in template_doc.items: # Asumiendo que 'items' es el nombre de la tabla en QC Template
                self.append("detalle_resultados", {
                    "categoria": item.categoria,
                    "parametro": item.parametro,
                    "tipo_parametro": item.tipo_parametro,
                    "valor_minimo" : item.valor_minimo,
                    "valor_maximo" : item.valor_maximo,
                    "tipo_ingreso" : item.tipo_ingreso
                    # Los campos de resultado se dejan vacíos para el usuario
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
    