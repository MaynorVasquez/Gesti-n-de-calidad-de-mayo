// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt

frappe.query_reports["Análisis Lavado de Manos ATP"] = {
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

        let dashboard = report.wrapper.querySelector(".bpm-atp-dashboard");
        if (!dashboard) {
            dashboard = document.createElement("div");
            dashboard.className = "bpm-atp-dashboard";
            dashboard.style.padding = "15px";
            report.wrapper.prepend(dashboard);
        }
        dashboard.innerHTML = "";

        const summary = this.get_kpi_data(rows);
        this.render_kpi_cards(dashboard, summary);
        this.render_incident_trend_chart(dashboard, summary.incident_trend);

        // 2. Contenedor de Gráficos (Grid de 2 columnas)
        const charts_wrapper = document.createElement("div");
        charts_wrapper.style.cssText = `
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
            gap: 20px;
        `;
        dashboard.appendChild(charts_wrapper);
        // Dibujar el gráfico de tendencia diario        
        this.render_dept_bar_chart(charts_wrapper, summary.dept_incidents);
        this.render_gender_pie_chart(charts_wrapper, summary.gender_incidents);
        //this.render_area_bar_chart(dashboard, summary.area_incidents);
        this.render_area_bar_chart(dashboard, summary.area_incidents);
    },

    get_kpi_data: function(rows) {
        let dept_incidents = {};
        let area_incidents = {};
        let gender_stats = {}; // Nueva estadística para Género
        let incident_trend = {}; // Objeto para agrupar { "2026-03-01": 5, "2026-03-02": 2 }
        let cumplimiento_count = 0;
        let total_pruebas = rows.length;
        let empleados_unicos = new Set();
        let suma_atp = 0;

        rows.forEach(r => {
            const fecha = r.fecha_inspeccion;
            const dept = r.department || "Sin Departamento";
            const area = r.area || "Sin Área";
            const gen = r.gender || "No Especificado"; // Captura de género
            if (!fecha) return;

            // Inicializar contadores si no existen
            if (fecha && !incident_trend[fecha]) incident_trend[fecha] = 0;
            if (!dept_incidents[dept]) dept_incidents[dept] = 0;
            if (!area_incidents[area]) area_incidents[area] = 0;
            if (!gender_stats[gen]) gender_stats[gen] = 0; // Inicializar género

            // Contamos solo si es "No Conforme"
            // Nota: Ajusta "No Conforme" si en tu base de datos se guarda diferente (ej. "Falló")
            if (r.cumplimiento === "No Conforme") {
                if (fecha) incident_trend[fecha]++;
                dept_incidents[dept]++; // Sumamos el incidente al departamento
                gender_stats[gen]++;
                area_incidents[area]++;
            } else if (r.cumplimiento === "Conforme") {
                cumplimiento_count++;
            }
            suma_atp += flt(r.atp_resultado || 0);
  
            if (r.codigo_empleado) {
                empleados_unicos.add(r.codigo_empleado);
            }
        });

        return {
            total_pruebas: total_pruebas,
            incident_trend: incident_trend,
            porcentaje_cumplimiento: ((cumplimiento_count / total_pruebas) * 100).toFixed(1),
            promedio_atp: (suma_atp / total_pruebas).toFixed(0),
            total_empleados: empleados_unicos.size,
            dept_incidents: dept_incidents,
            gender_incidents: gender_stats,
            area_incidents: area_incidents,
        };
    },

    render_kpi_cards: function(container, s) {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = `
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 20px;
        `;

        const kpis = [
            { label: "Pruebas Realizadas", value: s.total_pruebas, color: "#5e64ff", icon: "fa fa-user-circle-o" },
            { label: "Cumplimiento %", value: s.porcentaje_cumplimiento + "%", color: s.porcentaje_cumplimiento > 90 ? "#28a745" : "#ffa00a", icon: "fa fa-line-chart" },
            { label: "Promedio ATP", value: s.promedio_atp, color: "#8d99a6", icon: "fa fa-flask" },
            { label: "Personal Evaluado", value: s.total_empleados, color: "#28a745", icon: "fa fa-users" }
        ];

        kpis.forEach(k => {
            const card = document.createElement("div");
            card.style.cssText = `
                background: #fff; 
                padding: 15px; 
                border-radius: 8px; 
                border: 1px solid #d1d8dd; 
                border-left: 5px solid ${k.color};
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            `;
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="${k.icon}" style="color: ${k.color}; font-size: 1.2em;"></i>
                    <div style="font-size: 11px; font-weight: bold; color: #8d99a6; text-transform: uppercase;">${k.label}</div>
                </div>
                <div style="font-size: 24px; font-weight: bold; margin-top: 8px; color: #36414c;">${k.value}</div>
            `;
            wrapper.appendChild(card);
        });

        container.appendChild(wrapper);
    },

    render_incident_trend_chart: function(container, trend_data) {
        const card = createChartCard(
            container,
            "Tendencia Diaria de Incidentes"
        );

        // ORDENAMIENTO: Es vital para que la tendencia tenga sentido
        const sorted_dates = Object.keys(trend_data).sort((a, b) => new Date(a) - new Date(b));
        const incident_values = sorted_dates.map(date => trend_data[date]);

        // new frappe.Chart("#incident-daily-chart", {
        const chart = new frappe.Chart(card.body,{
            title: "Tendencia Diaria de Incidentes (No Conformes)",
            data: {
                labels: sorted_dates, // Fechas en el Eje X
                datasets: [
                    {
                        name: "Incidentes",
                        chartType: "line",
                        values: incident_values
                    }
                ]
            },
            type: 'line',
            height: 300,
            colors: ['#ff4d4d'], // Rojo intenso para incidentes
            lineOptions: {
                regionFill: 1, // Sombreado bajo la línea para mejor visibilidad
                dotSize: 5    // Puntos más visibles en cada día
            },
            axisOptions: {
                xIsSeries: true, // Optimiza el eje para fechas
                shortenYAxisNumbers: 1
            },
            tooltipOptions: {
                formatTooltipY: d => d + " incidentes"
            }
        });
        card.button.onclick = () =>
            exportSVG(chart,"Tendencia_Diaria_Incidentes");
    },

    render_dept_bar_chart: function(container, dept_data) {
        const card = createChartCard(
            container,
            "Indidentes por departamento"
        );

        // Ordenar departamentos por cantidad de incidentes (Descendente)
        const sorted_depts = Object.keys(dept_data).sort((a, b) => dept_data[b] - dept_data[a]);
        const values = sorted_depts.map(d => dept_data[d]);

        const chart = new frappe.Chart(card.body,{
            title: "Incidentes por Departamento",
            data: {
                labels: sorted_depts,
                datasets: [{
                    name: "Incidentes",
                    chartType: "bar",
                    values: values
                }]
            },
            type: 'bar',
            height: 300,
            colors: ['#ff5858'], // Rojo para mantener la consistencia de "alerta"
            barOptions: {
                spaceRatio: 0.2 // Barras un poco más anchas y profesionales
            },
            tooltipOptions: {
                formatTooltipY: d => d + " incidentes detectados"
            }
        });
        card.button.onclick = () =>
            exportSVG(chart,"incidentes_por_departamento");
    },

    render_area_bar_chart: function(container, area_data) {
        const card = createChartCard(
            container,
            "Incidentes por área"
        );

        // Ordenar áreas por cantidad de incidentes (Mayor a Menor)
        const sorted_areas = Object.keys(area_data).sort((a, b) => area_data[b] - area_data[a]);
        const values = sorted_areas.map(a => area_data[a]);

        const chart = new frappe.Chart(card.body,{
            title: "Incidentes por Área Específica",
            data: {
                labels: sorted_areas,
                datasets: [{
                    name: "Incidentes",
                    chartType: "bar",
                    values: values
                }]
            },
            type: 'bar',
            height: 300,
            colors: ['#ff5858'], // Rojo consistente para incidentes
            barOptions: {
                spaceRatio: 0.3
            },
            tooltipOptions: {
                formatTooltipY: d => d + " fallas detectadas"
            }
        });
        card.button.onclick = () =>
            exportSVG(chart,"indidentes_por_area");
    },

    render_gender_pie_chart: function(container, gender_stats) {
        const card = createChartCard(
            container,
            "Incidentes por área"
        );

        const labels = Object.keys(gender_stats);
        const values = labels.map(g => gender_stats[g]);

        const chart = new frappe.Chart(card.body,{
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
        card.button.onclick = () =>
            exportSVG(chart,"incidentes_por_genero");
    },

};

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
    a.download = filename + ".svg";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

function createChartCard(container, title) {

    const card = document.createElement("div");
    card.style.cssText = `
        background:#fff;
        border:1px solid #d1d8dd;
        border-radius:8px;
        padding:15px;
        margin-top:20px;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:15px;
    `;

    const lbl = document.createElement("h5");
    lbl.innerText = title;
    lbl.style.margin = "0";

    const btn = document.createElement("button");
    btn.className = "btn btn-default btn-xs";
    btn.innerHTML = '<i class="fa fa-download"></i> Exportar gráfica';

    const body = document.createElement("div");

    header.appendChild(lbl);
    header.appendChild(btn);

    card.appendChild(header);
    card.appendChild(body);

    container.appendChild(card);

    return {
        body,
        button: btn
    };
}