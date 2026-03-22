import frappe
from frappe.model.document import Document
from frappe.utils import flt

class QCOrdenyLimpieza(Document):

    def before_insert(self):
        # 8 espacios exactos aquí
        self.full_user_name = frappe.utils.get_fullname(frappe.session.user)

    def validate(self):
        # 8 espacios exactos aquí
        self.calcular_totales()

    def calcular_totales(self):
        gran_total = 0
        cantidad_filas = 0
        
        for fila in self.listado_areas:
            valores = [
                fila.or_resultado,
                fila.ppt_resultado,
                fila.eu_resultado,
                fila.elm_resultado,
                fila.bs_resultado,
                fila.ep_resultado
            ]
            
            # Convertimos a float y filtramos valores válidos
            valores_numericos = [flt(v) for v in valores if v is not None]
            
            cantidad_campos = len(valores_numericos)
            
            suma_linea = sum(valores_numericos)
            
            # 🔹 Validación división por cero
            if cantidad_campos > 0:
                promedio_linea = suma_linea / cantidad_campos
            else:
                promedio_linea = 0
            
            fila.resultado = promedio_linea
            
            gran_total += promedio_linea
            cantidad_filas += 1

        # 🔹 Validación división por cero (total)
        if cantidad_filas > 0:
            self.total = gran_total / cantidad_filas
        else:
            self.total = 0
        