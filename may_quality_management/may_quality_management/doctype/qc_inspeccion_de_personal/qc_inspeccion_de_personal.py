# Copyright (c) 2026, Maynor Vasquez and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document


class QCInspecciondePersonal(Document):
	def before_insert(self):
		self.supervisor = frappe.utils.get_fullname(frappe.session.user)

