// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt

frappe.query_reports["Análisis de Tendencia de Orden y Limpieza"] = {
    "filters": [
        {
            "fieldname": "departamento",
            "label": __("Departamento"),
            "fieldtype": "Link",
            "options": "Department",
        },
        {
            "fieldname": "area",
            "label": __("Área de limpieza"),
            "fieldtype": "Link",
            "options": "QC Area de limpieza",
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
            "fieldname": "group_by",
            "label": __("Agrupar por"),
            "fieldtype": "Select",
            "options": [
                { "label": __("Diario"), "value": "daily" },
                { "label": __("Semanal"), "value": "weekly" },
                { "label": __("Mensual"), "value": "monthly" }
            ],
            "on_change": function() {
                // Esto fuerza al reporte a volver a renderizarse al cambiar este filtro
                frappe.query_report.refresh();
            }
        }
    ],
    
	after_datatable_render: function(report) {
        
        const rows = report.datamanager.data;
        if (!rows || !rows.length) return;

        let chart_container = report.wrapper.querySelector(".my-custom-chart");
        if (!chart_container) {
            chart_container = document.createElement("div");
            chart_container.className = "my-custom-chart";
            chart_container.style.padding = "15px";
            const report_graph_area = report.wrapper.querySelector(".report-graph");
            if (report_graph_area) {
                report_graph_area.after(chart_container);
            } else {
                report.wrapper.prepend(chart_container);
            }
        }
        chart_container.innerHTML = ""; 

        // --- 1. CÁLCULO DE PROMEDIOS ---
        const dept_stats = {};

        rows.forEach(r => {
            if (r.departamento) {
                if (!dept_stats[r.departamento]) {
                    dept_stats[r.departamento] = { suma_total: 0, conteo: 0 };
                }
                dept_stats[r.departamento].suma_total += flt(r.total);
                dept_stats[r.departamento].conteo += 1;
            }
        });

        const labels = Object.keys(dept_stats);
        const alcanzado = [];
        const objetivo = []; // Línea estática de 100

        labels.forEach(dept => {
            const avg = (dept_stats[dept].suma_total / dept_stats[dept].conteo).toFixed(2);
            alcanzado.push(avg);
            objetivo.push(100); // Siempre 100 para todos los departamentos
        });

        // --- 2. RENDERIZAR GRÁFICO COMBINADO ---
        new frappe.Chart(chart_container, {
            title: __("Cumplimiento de Puntaje vs. Objetivo (100 pts)"),
            data: {
                labels: labels,
                datasets: [
                    {
                        name: __("Objetivo"),
                        values: objetivo,
                        chartType: 'line' // Esto crea la línea estática arriba
                    },
                    {
                        name: __("Puntaje Alcanzado"),
                        values: alcanzado,
                        chartType: 'bar'
                    }
                ]
            },
            type: 'axis-mixed', // Tipo mixto para permitir línea y barra juntas
            height: 300,
            colors: ['#eb5757', '#5e64ff'], // Rojo para el objetivo, Azul para el actual
            tooltipOptions: {
                formatTooltipY: d => d + " / 100 pts"
            }
        });
        render_trend_line_chart(report, rows);
		render_department_kpis(report, dept_stats);

    }
};

function render_department_kpis(report, dept_stats) {
    // 1. Buscamos o creamos el contenedor de KPIs
    let kpi_container = report.wrapper.querySelector(".dept-kpi-wrapper");
    if (!kpi_container) {
        kpi_container = document.createElement("div");
        kpi_container.className = "dept-kpi-wrapper";
        kpi_container.style.display = "grid";
        kpi_container.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
        kpi_container.style.gap = "15px";
        kpi_container.style.padding = "15px";
        kpi_container.style.marginBottom = "20px";
        
        // Lo ponemos al principio de todo el reporte
        report.wrapper.prepend(kpi_container);
    }
    kpi_container.innerHTML = ""; // Limpiar

    // 2. Generar una tarjeta por cada departamento en dept_stats
    Object.keys(dept_stats).forEach(dept => {
        const stats = dept_stats[dept];
        const promedio = (stats.suma_total / stats.conteo);
        const porcentaje = promedio.toFixed(1);
        
        // Color dinámico según el desempeño
        let color = "#28a745"; // Verde (Excelente)
        if (promedio < 95) color = "#ffa00a"; // Naranja (Alerta)
        if (promedio < 85) color = "#ff5858"; // Rojo (Crítico)

        const card = document.createElement("div");
        card.style.cssText = `
            background: #fff;
            border-radius: 8px;
            border-left: 5px solid ${color};
            padding: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            border-top: 1px solid #d1d8dd;
            border-right: 1px solid #d1d8dd;
            border-bottom: 1px solid #d1d8dd;
        `;

        card.innerHTML = `
            <div style="font-size: 11px; color: #8d99a6; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">
                ${dept}
            </div>
            <div style="display: flex; align-items: baseline; gap: 5px;">
                <span style="font-size: 22px; font-weight: bold; color: #36414c;">${porcentaje}%</span>
                <span style="font-size: 10px; color: ${color}; font-weight: bold;">CUMPLIMIENTO</span>
            </div>
            <div style="width: 100%; background: #f0f0f0; height: 6px; border-radius: 3px; margin-top: 8px;">
                <div style="width: ${porcentaje}%; background: ${color}; height: 100%; border-radius: 3px;"></div>
            </div>
        `;
        
        kpi_container.appendChild(card);
    });
}

function render_trend_line_chart(report, rows) {
    try {
        let trend_chart_container = report.wrapper.querySelector(".trend-line-chart");
                
        if (!trend_chart_container) {
            trend_chart_container = document.createElement("div");
            trend_chart_container.className = "trend-line-chart";
            trend_chart_container.style.padding = "15px";
            trend_chart_container.style.marginTop = "20px";
            
            const datatable = report.wrapper.querySelector(".datatable-main-section") || report.wrapper.querySelector(".datatable");
            if (datatable) {
                datatable.parentNode.insertBefore(trend_chart_container, datatable);
            } else {
                report.wrapper.appendChild(trend_chart_container);
            }
        }
        trend_chart_container.innerHTML = "";

        // 1. Obtención robusta del filtro
        const group_by = frappe.query_report.get_filter_value("group_by") || "daily";
        console.log("Agrupación actual:", group_by);

        const stats = {};
        rows.forEach(r => {
            if (r.fecha_inspeccion) {
                const date_obj = frappe.datetime.str_to_obj(r.fecha_inspeccion);
                let key, label;
                if (group_by === "monthly") {

                    label = date_obj.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
                    key = `${date_obj.getFullYear()}-${String(date_obj.getMonth() + 1).padStart(2, '0')}`;

                } else if (group_by === "weekly") {

                    const week = getISOWeek(date_obj);
                    const year = date_obj.getFullYear();

                    key = `${year}-W${String(week).padStart(2, '0')}`;
                    label = `Sem ${week} - ${year}`; 

                } else {

                    const day = String(date_obj.getDate()).padStart(2, '0');
                    const month = String(date_obj.getMonth() + 1).padStart(2, '0');

                    label = `${day}/${month}`;
                    key = r.fecha_inspeccion;

                }
                if (!stats[key]) {
                    stats[key] = { label: label, suma: 0, conteo: 0 };
                }

                stats[key].suma += flt(r.total);
                stats[key].conteo += 1;
                
            }
        });
        const sorted_keys = Object.keys(stats).sort();
        const labels = sorted_keys.map(k => stats[k].label);
        const values = sorted_keys.map(k => (stats[k].suma / stats[k].conteo).toFixed(2));

        // --- SOLUCIÓN AL ERROR DE SVG ---
        if (labels.length > 0) {
            // Si solo hay un punto de datos, forzamos tipo 'bar' para evitar el error del path "M"
            // Si hay 2 o más, usamos 'line'
            const chart_type = labels.length === 1 ? 'bar' : 'line';

            const group_labels = {
                daily: "Diaria",
                weekly: "Semanal",
                monthly: "Mensual"
            };

            const title = __("Tendencia de Calidad (" + (group_labels[group_by] || "Diaria") + ")");

            new frappe.Chart(trend_chart_container, {
                title: title,
                data: {
                    labels: labels,
                    datasets: [{
                        name: __("Promedio"),
                        values: values
                    }]
                },
                type: chart_type, 
                height: 300,
                colors: [group_by === "monthly" ? '#5e64ff' : '#28a745'],
                lineOptions: { 
                    regionFill: 1, 
                    hideDots: 0 
                },
                axisOptions: { 
                    xIsSeries: 1,
                    xAxisMode: 'tick' 
                }
            });
        }
    } catch (e) {
        console.error("Error en render_trend_line_chart:", e);
    }
}

function getISOWeek(date) {
    const tempDate = new Date(date);
    tempDate.setHours(0, 0, 0, 0);

    // jueves de la semana actual
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);

    const week1 = new Date(tempDate.getFullYear(), 0, 4);

    return 1 + Math.round(((tempDate - week1) / 86400000
        - 3 + (week1.getDay() + 6) % 7) / 7);
}