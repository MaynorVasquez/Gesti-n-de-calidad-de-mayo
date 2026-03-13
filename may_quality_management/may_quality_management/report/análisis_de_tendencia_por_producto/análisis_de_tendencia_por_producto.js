frappe.query_reports["Análisis de Tendencia por Producto"] = {
    "filters": [
        {
            "fieldname": "qc_producto",
            "label": __("Seleccionar Producto"),
            "fieldtype": "Link",
            "options": "QC Producto",
            "reqd": 1,
			//Función para obtener los datos del doctype qc_producto para poder 
			//rellenar los campos informativos. 
			"on_change": function() {
                const producto = frappe.query_report.get_filter_value('qc_producto');
                if (producto) {
                    frappe.db.get_value('QC Producto', producto, ['qc_template', 
																	'itemname', 
																	'batchnum'
																	,'docdate'
																,'docduedate'], (r) => {
                        if (r) {
                            frappe.query_report.set_filter_value('qc_template', r.qc_template);
                            frappe.query_report.set_filter_value('itemname', r.itemname);
							frappe.query_report.set_filter_value('batchnum', r.batchnum);
							frappe.query_report.set_filter_value('docdate', r.docdate);
							frappe.query_report.set_filter_value('docduedate', r.docduedate);
                        }
                    });
                }
            }
        },
		{
            "fieldname": "qc_template",
            "label": __("Código"),
            "fieldtype": "Data",
            "read_only": 1 // Esto evita que el usuario lo edite
        },
		{
            "fieldname": "itemname",
            "label": __("Descripción"),
            "fieldtype": "Small Text",
            "read_only": 1 // Esto evita que el usuario lo edite
        },
		{
            "fieldname": "batchnum",
            "label": __("Lote"),
            "fieldtype": "Data",
            "read_only": 1 // Esto evita que el usuario lo edite
        },
		{
            "fieldname": "docdate",
            "label": __("Fecha"),
            "fieldtype": "Date",
            "read_only": 1 // Esto evita que el usuario lo edite
        },
		{
            "fieldname": "docduedate",
            "label": __("Fecha de vencimiento"),
            "fieldtype": "Date",
            "read_only": 1 // Esto evita que el usuario lo edite
        },
    ],
    after_datatable_render: function(report) {

		const rows = report.datamanager.data;
		console.log(report)

		if (!rows || !rows.length) {
			console.log("No hay datos");
			return;
		}

		let area = report.wrapper.querySelector(".chart-area");
		if (!area) {
            // Si no existe .chart-area, buscamos .report-graph (estándar de Frappe)
            area = report.wrapper.querySelector(".report-graph");
        }

        if (!area) {
            // Si sigue sin existir, creamos un div nuevo para no borrar la tabla
            area = document.createElement("div");
            area.className = "custom-charts-section";
            // Lo insertamos antes de la tabla (datatable)
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

			const wrapper = document.createElement("div");
			wrapper.style.height = "300px";
			wrapper.style.marginBottom = "40px";

			area.appendChild(wrapper);

			if (info.tipo === 'Número') {
				new frappe.Chart(wrapper, {
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
			} else {
				// --- GRÁFICO DE PASTEL / PORCENTAJE ---
				const pie_labels = Object.keys(info.conteo_seleccion); 
				const pie_values = Object.values(info.conteo_seleccion);

				// Calculamos el total para el subtítulo o leyenda
				const total = pie_values.reduce((a, b) => a + b, 0);

				new frappe.Chart(wrapper, {
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
			}
		});
	}
};