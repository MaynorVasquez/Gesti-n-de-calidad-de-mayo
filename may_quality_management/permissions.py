import frappe

ALLOWED_ROLES = ("Quality Inspector", "System Manager")


def has_app_permission():
    """Decide si el icono de QC Dashboard se muestra en /apps para el usuario actual."""
    user = frappe.session.user
    if not user or user == "Guest":
        return False
    user_roles = set(frappe.get_roles(user))
    return any(role in user_roles for role in ALLOWED_ROLES)
