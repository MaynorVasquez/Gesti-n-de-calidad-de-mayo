// Copyright (c) 2026, Maynor Vasquez and contributors
// For license information, please see license.txt

frappe.query_reports["Análisis de Inspección de transporte"] = {
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
        //this.render_department_chart(charts_row, summary.dept_stats);
		//this.render_gender_pie_chart(charts_row, summary.gender_stats);
		//this.render_status_donut_chart(charts_row, summary.status_stats);
        
    },

    get_processed_data: function(rows) {
        let dept_stats   = {};
        let gender_stats = {};
        let trend_stats  = {};
        let status_stats = {};
        let defect_stats = {};   // ← ya NO estático: se llena según los datos

        rows.forEach(r => {
            const dept        = r.department || "General";
            const gen         = r.gender     || "No Especificado";
            const fecha       = r.fecha;
            const status      = r.status     || "Desconocido";
            const parametro   = r.parametro  || "Sin Parámetro";   // ← Link field
            const cumplimiento = (r.cumplimiento || "").trim();

            // ---- Agrupaciones generales ----
            if (!dept_stats[dept]) dept_stats[dept] = { suma: 0, total: 0, fallas: 0 };
            dept_stats[dept].suma += flt(r.total || 0);
            dept_stats[dept].total++;

            if (!trend_stats[fecha])  trend_stats[fecha] = 0;
            if (!gender_stats[gen])   gender_stats[gen]  = 0;
            if (!status_stats[status]) status_stats[status] = 0;

            // ---- KPI dinámico por parámetro ----
            // Se crea la llave "al vuelo" la primera vez que aparece el parámetro
            if (!defect_stats[parametro]) defect_stats[parametro] = 0;

            // Cuenta sólo cuando NO cumple
            if (cumplimiento === "No Cumple" || cumplimiento === "No Conforme") {
                defect_stats[parametro]++;
                dept_stats[dept].fallas++;
                trend_stats[fecha]++;
                gender_stats[gen]++;
            }

            status_stats[status]++;
        });

        // (Opcional) ordenar alfabéticamente las tarjetas KPI
        // Si prefieres el orden de aparición en el query, comenta estas 3 líneas.
        const ordenado = {};
        Object.keys(defect_stats).sort().forEach(k => ordenado[k] = defect_stats[k]);
        defect_stats = ordenado;

        return { dept_stats, defect_stats, trend_stats, gender_stats, status_stats };
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
        const card = createChartCard(
            container,
            "Tendencia Diaria de Incidentes"
        );

        // Preparar y ordenar los datos por fecha
        const sorted_dates = Object.keys(trend_stats).sort();
        const data_values = sorted_dates.map(date => trend_stats[date]);

        // Configuración del gráfico de Frappe
        // new frappe.Chart("#incident-trend-chart", {
        const chart = new frappe.Chart(card.body,{
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
        card.button.onclick = () =>
            exportSVG(chart,"Tendencia_Diaria_Incidentes");
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
