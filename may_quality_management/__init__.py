__version__ = "15.4.3"

import frappe
from frappe import _

def patch_helpdesk_permissions():
    try:
        # Importa la ruta exacta donde Helpdesk tiene su función
        import helpdesk.api.permission as helpdesk_perm

        # Guardamos la función original
        _original_has_app_permission = helpdesk_perm.has_app_permission

        def custom_has_app_permission():
            # Si pasa la validación original de Helpdesk (System Manager, Agent, etc.), dale acceso
            if _original_has_app_permission():
                return True

            # Agrega los roles adicionales que TÚ quieres permitir
            mis_roles_adicionales = {"Helpdesk user"}
            user_roles = set(frappe.get_roles())
            
            return bool(mis_roles_adicionales.intersection(user_roles))

        # Sobrescribimos la función en memoria
        helpdesk_perm.has_app_permission = custom_has_app_permission

    except (ImportError, AttributeError):
        pass

# Ejecutamos el parche al cargar la app
patch_helpdesk_permissions()