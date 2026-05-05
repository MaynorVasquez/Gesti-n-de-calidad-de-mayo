import frappe
from urllib.parse import quote

no_cache = 1
sitemap = 0


def get_context(context):
    if frappe.session.user == "Guest":
        path = frappe.request.path or "/qc-dashboard"
        qs = frappe.request.query_string
        if isinstance(qs, bytes):
            qs = qs.decode()
        if qs:
            path = f"{path}?{qs}"
        frappe.local.flags.redirect_location = f"/login?redirect-to={quote(path, safe='/?=&')}"
        raise frappe.Redirect

    csrf_token = frappe.sessions.get_csrf_token()
    frappe.db.commit()
    context.csrf_token = csrf_token
    return context
