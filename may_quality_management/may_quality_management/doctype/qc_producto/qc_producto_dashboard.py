# from frappe import _

# def get_data():
#     return {
#         'fieldname': 'qc_producto', 
#         'transactions': [
#             {
#                 'label': _('Control de Calidad'),
#                 'items': ['QC Producto Muestra', 'QC paros de producion']
#             }
#         ],
#         # Agregamos esta sección para forzar el conteo
#         'internal_links': {
#             'QC Producto Muestra': ['qc_producto'],
#             'QC paros de producion': ['qc_producto']
#         }
#     }