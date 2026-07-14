// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt
function exportSVG(chart, filename) {

    const svg = chart.parent.querySelector("svg");

    if (!svg) {
        frappe.msgprint(__("No fue posible obtener la gráfica."));
        return;
    }

    let source = new XMLSerializer().serializeToString(svg);

    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(
            /^<svg/,
            '<svg xmlns="http://www.w3.org/2000/svg"'
        );
    }

    const blob = new Blob([source], {
        type: "image/svg+xml;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.svg`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

frappe.query_reports["Análisis de Tendencia de Control de Calidad"] = {
	"filters": [
		{
			"fieldname": "producto",
            "label": __("Seleccionar Producto"),
            "fieldtype": "Link",
            "options": "QC Template",
            "reqd": 1,
			"on_change": function() {
                const producto = frappe.query_report.get_filter_value('producto');
                if (producto) {
                    frappe.db.get_value('QC Template', producto, ['nombre_producto'], (r) => {
                        if (r) {
                            frappe.query_report.set_filter_value('nombre_producto', r.nombre_producto);
                        }
                    });
                }
            }
		},
		{
            "fieldname": "nombre_producto",
            "label": __("Producto"),
            "fieldtype": "Data",
            "read_only": 1 // Esto evita que el usuario lo edite
        },
		{
			"fieldname": "fecha_inicio",
			"label": __("Fecha de Inicio"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_start()
		},
		{
			"fieldname": "fecha_fin",
			"label": __("Fecha de Fin"),
			"fieldtype": "Date",
			"default": frappe.datetime.month_end()
		},
		{
			"fieldname": "parametro",
			"label": __("Parámetro"),
			"fieldtype": "Link",
			"options": "QC Parametro",
			"on_change": function() {
				// Refresca el reporte automáticamente en cuanto el usuario elige o borra un parámetro
				frappe.query_report.refresh();
			}
		}
	],
    after_datatable_render: function(report) {

		const rows = report.datamanager.data;
		// console.log(rows)

		if (!rows || !rows.length) {
			// console.log("No hay datos");
			let old_area = report.wrapper.querySelector(".custom-charts-section");
            if (old_area) old_area.innerHTML = "";
			return;
		}

		let area = report.wrapper.querySelector(".custom-charts-section");
		if (!area) {
            // Si no existe (primera carga), lo creamos
            area = document.createElement("div");
            area.className = "custom-charts-section";
            // Lo insertamos antes de la tabla
            report.wrapper.prepend(area);
        }
		//const area = report.wrapper.querySelector(".chart-area") || report.wrapper;
		area.innerHTML = "";

		// Agrupar por parámetro
		const grouped = {};

		rows.forEach(r => {

			if (!grouped[r.parametro]) {
				grouped[r.parametro] = {
					tipo: r.tipo_parametro,
					labels: [],
					mins: [],
					results: [],
					maxs: [],
					conteo_seleccion: {}
				};
			}

			if (r.tipo_parametro === 'Número') {
				grouped[r.parametro].labels.push(r.docdate + " " + r.hora_muestra);
				grouped[r.parametro].mins.push(r.valor_minimo);
				grouped[r.parametro].results.push(r.resultado);
				grouped[r.parametro].maxs.push(r.valor_maximo);
			}else {
				// Es de tipo 'Selección' (ej. r.resultado = 'Cumple')
				const valor = r.conformidad || 'Sin valor';
            	grouped[r.parametro].conteo_seleccion[valor] = (grouped[r.parametro].conteo_seleccion[valor] || 0) + 1;
			}
			
		});

		// Crear un gráfico por parámetro
		Object.keys(grouped).forEach(param => {

			const info = grouped[param];

			// const wrapper = document.createElement("div");
			// wrapper.style.height = "300px";
			// wrapper.style.marginBottom = "40px";

			// area.appendChild(wrapper);
			const card = document.createElement("div");
			card.className = "chart-card";
			card.style.marginBottom = "35px";
			card.style.border = "1px solid #d1d8dd";
			card.style.borderRadius = "8px";
			card.style.padding = "15px";
			card.style.backgroundColor = "#fff";

			const header = document.createElement("div");
			header.style.display = "flex";
			header.style.justifyContent = "space-between";
			header.style.alignItems = "center";
			header.style.marginBottom = "15px";

			const title = document.createElement("h5");
			title.innerText = param;
			title.style.margin = "0";

			const btn = document.createElement("button");
			btn.className = "btn btn-default btn-xs";
			btn.innerHTML = '<i class="fa fa-download"></i> Exportar gráfica';

			header.appendChild(title);
			header.appendChild(btn);

			const wrapper = document.createElement("div");
			wrapper.style.height = "320px";

			card.appendChild(header);
			card.appendChild(wrapper);

			area.appendChild(card);

			if (info.tipo === 'Número') {
				const chart = new frappe.Chart(wrapper, {
					title: param,
					data: {
						labels: info.labels,
						datasets: [
							{ name: "Mínimo", values: info.mins },
							{ name: "Resultado", values: info.results },
							{ name: "Máximo", values: info.maxs }
						]
					},
					type: "line",
					height: 350
				});
				btn.onclick = () => exportSVG(chart, param);
			} else {
				// --- GRÁFICO DE PASTEL / PORCENTAJE ---
				const pie_labels = Object.keys(info.conteo_seleccion); 
				const pie_values = Object.values(info.conteo_seleccion);

				// Calculamos el total para el subtítulo o leyenda
				const total = pie_values.reduce((a, b) => a + b, 0);

				const chart = new frappe.Chart(wrapper, {
					title: `${param} (Total: ${total} muestras)`,
					data: {
						labels: pie_labels,
						datasets: [
							{ 
								name: "Conformidad",
								values: pie_values 
							}
						]
					},
					type: "percentage", // 'percentage' es excelente en Frappe porque muestra la barra de proporción con %
					height: 300,
					colors: ['#28a745', '#ff5858', '#ffa00a'], 
					barOptions: {
						height: 40, // Grosor de la barra de porcentaje
						depth: 2
					},
					tooltipOptions: {
						formatTooltipY: d => ((d / total) * 100).toFixed(1) + "% (" + d + ")"
					}
				});
				btn.onclick = () => exportSVG(chart, param);
			}
		});
	}
};

