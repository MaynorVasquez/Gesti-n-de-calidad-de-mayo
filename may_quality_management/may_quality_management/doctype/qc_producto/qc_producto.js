// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("QC Producto", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on('QC Producto', {
    refresh: function(frm) {
        // 1. Limpiamos ambos botones antes de renderizar
        frm.remove_custom_button(__('Muestra de Calidad'), __('Crear'));
        frm.remove_custom_button(__('Paro de Producción'), __('Crear'));

        const estados_prohibidos = ["Borrador", "Cerrado", "Cancelado"];

        if (!frm.is_new() && !estados_prohibidos.includes(frm.doc.status)) {
            
            // BOTÓN A: Muestra de Calidad
            frm.add_custom_button(__('Muestra de Calidad'), function() {
                frappe.model.with_doctype('QC Producto Muestra', () => {
                    let new_doc = frappe.model.get_new_doc('QC Producto Muestra');
                    new_doc.qc_producto = frm.doc.name; 
                    frappe.set_route('Form', 'QC Producto Muestra', new_doc.name);
                });
            }, __('Crear'));

            // BOTÓN B: Paros de Producción
            frm.add_custom_button(__('Paro de Producción'), function() {
                frappe.model.with_doctype('QC Paros de Produccion', () => {
                    let new_doc = frappe.model.get_new_doc('QC Paros de Produccion');
                    // Asegúrate de que el campo Link en 'QC Paros de Producción' se llame 'qc_producto'
                    new_doc.qc_producto = frm.doc.name; 
                    frappe.set_route('Form', 'QC Paros de Produccion', new_doc.name);
                });
            }, __('Crear'));

            // Opcional: Esto hace que el botón de "Crear" resalte en azul
            frm.set_custom_button_upsert(__('Crear'), null, 'btn-primary');
        }
    }
});