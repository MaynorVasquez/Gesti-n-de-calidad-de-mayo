// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt

frappe.ui.form.on("QC Inspeccion y Liberacion de Vehiculos", {
	refresh(frm) {

	},
});

frappe.ui.form.on('QC Inspeccion y Liberacion detalle', {
    resultados: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.tipo_parametro === "Número") {
            let valor = flt(row.resultados);
            let min = flt(row.valor_minimo);
            let max = flt(row.valor_maximo);

            if (valor >= min && valor <= max) {
                row.indicador_vial = "🟢";
            } else {
                row.indicador_vial = "🔴";
            }
            frm.refresh_field("tabla_criterios");
        }
    },

    conformidad: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.tipo_parametro === "Selección") {
            if (row.conformidad === "Conforme") {
                row.indicador_vial = "🟢";
            } else if (row.conformidad === "No Conforme") {
                row.indicador_vial = "🔴";
            } else {
                row.indicador_vial = "";
            }
            frm.refresh_field("tabla_criterios");
        }
    }
});

