frappe.query_reports["Análisis de Inspección BPM a Personal"] = {
    "filters": [
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
        }
    ],

    after_datatable_render: function(report) {
        const rows = report.datamanager.data;
        if (!rows || rows.length === 0) return;

        let dashboard = report.wrapper.querySelector(".bpm-dashboard-container");
        if (!dashboard) {
            dashboard = document.createElement("div");
            dashboard.className = "bpm-dashboard-container";
            dashboard.style.padding = "15px";
            report.wrapper.prepend(dashboard);
        }
        dashboard.innerHTML = ""; 

        const summary = this.get_processed_data(rows);

        // 1. Renderizar KPIs (Tarjetas superiores)
        this.render_kpis(dashboard, summary.defect_stats);

		// 3. Renderizar los dos gráficos dentro de la fila
		this.render_trend_line(dashboard, summary.trend_stats); //un grafico por linea por ahora se comento porque se colocaron dos en una liena

		// 2. Contenedor para gráficos (para que salgan en fila si hay espacio)
        const charts_row = document.createElement("div");
        charts_row.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;";
        dashboard.appendChild(charts_row);
        //this.render_trend_line(charts_row, summary.trend_stats);
        this.render_department_chart(charts_row, summary.dept_stats);
		this.render_gender_pie_chart(charts_row, summary.gender_stats);
		this.render_status_donut_chart(charts_row, summary.status_stats);
        
    },

    get_processed_data: function(rows) {
        let dept_stats = {}; //Estadistica para departamento
		let gender_stats = {}; // Nueva estadística para Género
        let trend_stats = {}; //tendencia de incidentes por dia
		let status_stats = {}; //Estadística para Estado del Empleado
		
		

		let defect_stats = {
            "Manos Limpias": 0, "Uñas Limpias y Cortas": 0, "Barba": 0, "Uniforme Limpio": 0, 
            "Redecilla": 0, "Mascarilla": 0, "Maquillaje": 0, "Joyería": 0
        };
        // Mapeo de campos de la base de datos a etiquetas legibles
        const field_map = {
            "manos_limpias": "Manos Limpias",
            "ulc": "Uñas Limpias y Cortas", // Ajusta estos nombres según tus columnas reales en SQL
            "barba": "Barba",
            "uniforme_limpio": "Uniforme Limpio",
            "redecilla": "Redecilla",
            "mascarilla": "Mascarilla",
            "maquillaje": "Maquillaje",
            "joyeria": "Joyería"
        };

        rows.forEach(r => {
            const dept = r.department || "General";
			const gen = r.gender || "No Especificado"; // Captura de género
            const fecha = r.fecha_inspeccion;
			const status = r.status || "Desconocido"; // Captura de activo, suspendido, etc.

            if (!dept_stats[dept]) dept_stats[dept] = { suma: 0, total: 0, fallas: 0 };
            dept_stats[dept].suma += flt(r.total || 0);
            dept_stats[dept].total++;

			// Inicializar fecha en trend_stats si no existe
            if (!trend_stats[fecha]) trend_stats[fecha] = 0;
			if (!gender_stats[gen]) gender_stats[gen] = 0; // Inicializar género
			if (!status_stats[status]) status_stats[status] = 0; // Contador por estado

            // Conteo dinámico de "No conforme" para cada columna
            Object.keys(field_map).forEach(field => {
                if (r[field] === "No Conforme") {
                    const label = field_map[field];
                    defect_stats[label]++;
                    dept_stats[dept].fallas++;

					// Sumamos un incidente a la fecha correspondiente
                    trend_stats[fecha]++;
					gender_stats[gen]++;
					
                }
            });
			status_stats[status]++;

            // if (!trend_stats[fecha]) trend_stats[fecha] = { suma: 0, conteo: 0 };
            // trend_stats[fecha].suma += flt(r.total || 0);
            // trend_stats[fecha].conteo++;
        });

        return { dept_stats, defect_stats, trend_stats, gender_stats, status_stats};
    },

    render_kpis: function(container, defect_stats) {
        const kpi_wrapper = document.createElement("div");
        kpi_wrapper.style.cssText = `
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
            gap: 12px; 
            margin-bottom: 25px;
        `;

        Object.keys(defect_stats).forEach(label => {
            const count = defect_stats[label];
            // Si hay fallas (count > 0), usamos rojo; si está limpio, usamos verde.
            const color = count > 0 ? "#ff5858" : "#28a745";
            const bg_light = count > 0 ? "#fff5f5" : "#f6ffed";
            
            const card = document.createElement("div");
            card.style.cssText = `
                border: 1px solid #d1d8dd; 
                padding: 12px; 
                border-radius: 8px; 
                border-top: 4px solid ${color}; 
                background: ${bg_light};
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            `;
            
            card.innerHTML = `
                <div style="font-size: 11px; font-weight: bold; color: #525252; text-transform: uppercase; margin-bottom: 5px;">${label}</div>
                <div style="font-size: 24px; font-weight: bold; color: ${color};">${count}</div>
                <div style="font-size: 10px; color: #8d99a6;">Incidentes</div>
            `;
            kpi_wrapper.appendChild(card);
        });
        
        container.appendChild(kpi_wrapper);
    },

	render_trend_line: function(container, trend_stats) {
        // Crear contenedor para el gráfico
        const chart_container = document.createElement("div");
        chart_container.id = "incident-trend-chart";
        chart_container.style.cssText = `
            background: #fff; 
            border: 1px solid #d1d8dd; 
            border-radius: 8px; 
            padding: 15px; 
            margin-top: 20px;
        `;
        container.appendChild(chart_container);

        // Preparar y ordenar los datos por fecha
        const sorted_dates = Object.keys(trend_stats).sort();
        const data_values = sorted_dates.map(date => trend_stats[date]);

        // Configuración del gráfico de Frappe
        new frappe.Chart("#incident-trend-chart", {
            title: "Tendencia Diaria de Incidentes",
            data: {
                labels: sorted_dates,
                datasets: [
                    {
                        name: "Incidentes",
                        chartType: "line",
                        values: data_values
                    }
                ]
            },
            type: 'line', 
            height: 250,
            colors: ['#ff5858'], // Rojo para incidentes
            lineOptions: {
                regionFill: 1 // Relleno debajo de la línea
            },
            axisOptions: {
                xIsSeries: true // Tratar el eje X como serie de tiempo
            }
        });
    },

	render_department_chart: function(container, dept_stats) {
        // Crear contenedor para el gráfico
        const chart_container = document.createElement("div");
        chart_container.id = "dept-incident-chart";
        chart_container.style.cssText = `
            background: #fff; 
            border: 1px solid #d1d8dd; 
            border-radius: 8px; 
            padding: 15px; 
            margin-top: 20px;
        `;
        container.appendChild(chart_container);

        // Extraer etiquetas (Departamentos) y valores (Fallas)
        const labels = Object.keys(dept_stats);
        const values = labels.map(dept => dept_stats[dept].fallas);

        // Configuración del gráfico de barras
        new frappe.Chart("#dept-incident-chart", {
            title: "Incidentes Detectados por Departamento",
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Incidentes",
                        chartType: "bar",
                        values: values
                    }
                ]
            },
            type: 'bar',
            height: 280,
            colors: ['#ff5858'], // Mantener el rojo de incidentes para consistencia
            barOptions: {
                stacked: 0,
                spaceRatio: 0.5 // Barras un poco más delgadas para un look moderno
            },
            tooltipOptions: {
                formatTooltipY: d => d + " incidentes"
            }
        });
    },

    render_area_chart: function(container, dept_stats) {
        // Crear contenedor para el gráfico
        const chart_container = document.createElement("div");
        chart_container.id = "dept-incident-chart";
        chart_container.style.cssText = `
            background: #fff; 
            border: 1px solid #d1d8dd; 
            border-radius: 8px; 
            padding: 15px; 
            margin-top: 20px;
        `;
        container.appendChild(chart_container);

        // Extraer etiquetas (Departamentos) y valores (Fallas)
        const labels = Object.keys(dept_stats);
        const values = labels.map(dept => dept_stats[dept].fallas);

        // Configuración del gráfico de barras
        new frappe.Chart("#dept-incident-chart", {
            title: "Incidentes Detectados por Área",
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Incidentes",
                        chartType: "bar",
                        values: values
                    }
                ]
            },
            type: 'bar',
            height: 280,
            colors: ['#ff5858'], // Mantener el rojo de incidentes para consistencia
            barOptions: {
                stacked: 0,
                spaceRatio: 0.5 // Barras un poco más delgadas para un look moderno
            },
            tooltipOptions: {
                formatTooltipY: d => d + " incidentes"
            }
        });
    },

	render_gender_pie_chart: function(container, gender_stats) {
        const chart_container = document.createElement("div");
        chart_container.id = "gender-incident-pie";
        chart_container.style.cssText = `
            background: #fff; 
            border: 1px solid #d1d8dd; 
            border-radius: 8px; 
            padding: 15px; 
            margin-top: 20px;
        `;
        container.appendChild(chart_container);

        const labels = Object.keys(gender_stats);
        const values = labels.map(g => gender_stats[g]);

        new frappe.Chart("#gender-incident-pie", {
            title: "Incidentes por Género",
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Incidentes",
                        values: values
                    }
                ]
            },
            type: 'pie', // Gráfico tipo pastel
            height: 280,
            colors: ['#ff5858', '#5e64ff', '#ffa00a', '#28a745'] // Rojo dominante para el mayor riesgo
        });
    },

	render_status_donut_chart: function(container, status_stats) {
        const chart_container = document.createElement("div");
        chart_container.id = "status-employee-donut";
        chart_container.style.cssText = `
            background: #fff; 
            border: 1px solid #d1d8dd; 
            border-radius: 8px; 
            padding: 15px; 
            margin-top: 20px;
        `;
        container.appendChild(chart_container);

        const labels = Object.keys(status_stats);
        const values = labels.map(s => status_stats[s]);

        new frappe.Chart("#status-employee-donut", {
            title: "Estado del Personal Inspeccionado",
            data: {
                labels: labels,
                datasets: [
                    {
                        name: "Empleados",
                        values: values
                    }
                ]
            },
            type: 'donut', // Cambiamos a tipo dona
            height: 280,
            colors: ['#28a745', '#ffa00a', '#8d99a6', '#5e64ff'], // Verde, Naranja, Gris, Azul
            tooltipOptions: {
                formatTooltipY: d => d + " personas"
            }
        });
    },
};