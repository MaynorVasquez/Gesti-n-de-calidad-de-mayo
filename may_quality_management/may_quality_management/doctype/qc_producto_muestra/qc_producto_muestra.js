// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt

frappe.ui.form.on("QC Producto Muestra", {
	refresh(frm) {
        frm.set_query("qc_producto", function () {
            return {
                filters: {
                    status: "Abierto"
                }
            };
        });
	},
});

frappe.ui.form.on('QC Muestra Detalle', {
    form_render: function(frm, cdt, cdn) {
        let grid = frm.fields_dict['detalle_resultados'].grid;
        let current_row = grid.grid_rows_by_docname[cdn];
        
        if (current_row.grid_form && !current_row.grid_form.wrapper.find('.btn-nav-prev').length) {
            
            let title_area = current_row.grid_form.wrapper.find('.grid-form-heading');

            let row_index = grid.grid_rows.findIndex(r => r.doc.name === cdn);
            let total_rows = grid.grid_rows.length;
            let current_number = row_index + 1;

            let text_indicator = $(`<span class="text-muted" style="margin: 0 10px; font-weight: bold; font-size: 14px;">
                Fila ${current_number} de ${total_rows}
            </span>`);

            let btn_prev = $(`<button class="btn btn-default btn-nav-prev" style="margin-left: 10px; padding: 8px 16px; touch-action: manipulation;">
                <i class="fa fa-chevron-left"></i> Anterior
            </button>`);
            
            let btn_next = $(`<button class="btn btn-default btn-nav-next" style="padding: 8px 16px; touch-action: manipulation;">
                Siguiente <i class="fa fa-chevron-right"></i>
            </button>`);
            
            title_area.append(btn_prev).append(text_indicator).append(btn_next);
            
            const cambiar_fila = (nuevo_indice) => {
                // 1. Cerramos la fila actual
                current_row.toggle_view(false);
                
                // 2. Respiro para limpiar
                setTimeout(() => {
                    grid.grid_rows[nuevo_indice].toggle_view(true);
                    
                    // 3. Acomodo responsivo y salto instantáneo
                    setTimeout(() => {
                        $(window).trigger('resize');
                        
                        let modal_flotante = $('.modal:visible');
                        let nueva_fila_html = grid.grid_rows[nuevo_indice].wrapper;

                        //--- AQUÍ QUITAMOS LA ANIMACIÓN ---
                        if (modal_flotante.length > 0) {
                            // Salto directo al inicio del modal
                            modal_flotante.scrollTop(0); 
                        } else if (nueva_fila_html && nueva_fila_html.length) {
                            // Salto directo al inicio de la fila en vista en línea
                            $(window).scrollTop(nueva_fila_html.offset().top - 120);
                        }
                    }, 100);
                }, 50); 
            };

            btn_prev.on('click', function(e) {
                e.preventDefault();
                if (row_index > 0) {
                    cambiar_fila(row_index - 1);
                } else {
                    frappe.show_alert({message: __('Ya estás en la primera fila'), color: 'orange'});
                }
            });
            
            btn_next.on('click', function(e) {
                e.preventDefault();
                if (row_index < total_rows - 1) {
                    cambiar_fila(row_index + 1);
                } else {
                    frappe.show_alert({message: __('Ya estás en la última fila'), color: 'orange'});
                }
            });
        }
    }
});