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
        },
        {
            "fieldname": "parametro",
            "label": __("Seleccionar Parámetro"),
            "fieldtype": "MultiSelectList",
            "options": "QC Parametros de inspeccion vehiculos",
            "reqd": 1,
            "description": __("Seleccione uno o más parámetros para filtrar el reporte"),
            "get_data": function(txt) {
                return frappe.db.get_link_options(
                    "QC Parametros de inspeccion vehiculos",
                    txt
                );
            }
        },
        {
            "fieldname": "placa_vehiculo",
            "label": __("Seleccionar Placa Vehículo"),
            "fieldtype": "MultiSelectList",
            "options": "Vehicle",
            "reqd": 1,
            "description": __("Seleccione uno o más parámetros para filtrar el reporte"),
            "get_data": function(txt) {
                return frappe.db.get_link_options(
                    "Vehicle",
                    txt
                );
            }
        },

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
        this.render_kpis_placas(dashboard, summary.kpi_placa_stats);

		// 3. Renderizar los dos gráficos dentro de la fila
		this.render_trend_line(dashboard, summary.trend_stats); //un grafico por linea por ahora se comento porque se colocaron dos en una liena
    
        this.render_temp_trend_chart(dashboard,summary.temp_series,summary.temp_vehiculos);
		// 2. Contenedor para gráficos (para que salgan en fila si hay espacio)
        const charts_row = document.createElement("div");
        charts_row.style.cssText = "display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;";
        dashboard.appendChild(charts_row);
        //this.render_trend_line(charts_row, summary.trend_stats);
        //this.render_department_chart(charts_row, summary.dept_stats);
		this.render_product_pie_chart(charts_row, summary.tipo_porducto_stats);
        this.render_tipo_vehiculo_pie_chart(charts_row, summary.tipo_vehiculo_stats);
        this.render_candado_pie_chart(charts_row, summary.candado_stats);
		//this.render_status_donut_chart(charts_row, summary.status_stats);
        
    },

    get_processed_data: function(rows) {
        let dept_stats   = {};
        let gender_stats = {};
        let trend_stats  = {};
        let status_stats = {};
        let defect_stats = {};   // ← ya NO estático: se llena según los datos
        let tipo_porducto_stats = {}; // ← ya NO estático: se llena según los datos
        let kpi_placa_stats = {}; // ← ya NO estático: se llena según los datos
        let tipo_vehiculo_stats = {}; 
        let candado_stats = {};
        let thermo_stats = {};
        let temp_series   = []; //para series de vehiculos con temperatura

        const vistos_candado = new Set();
        const vistos_thermo = new Set();
        let temp_vehiculos = new Set(); //para graficar la tendencia por temperatura por vehiculo

        rows.forEach(r => {
            const dept        = r.department || "General";
            const gen         = r.gender     || "No Especificado";
            const fecha       = r.fecha;
            const status      = r.status     || "Desconocido";
            const parametro   = r.parametro  || "Sin Parámetro";   // ← Link field
            const cumplimiento = (r.cumplimiento || "").trim();
            const tipo_producto = r.tipo_producto || "General";
            const tipo_vehiculo = r.tipo_vehiculo || "General";
            const vehiculo = r.vehiculo || "Subcontratado";
            const candado = r.candado || "No Especificado";
            

            if (!vistos_candado.has(r.name)) {
                vistos_candado.add(r.name);
                if (!candado_stats[candado]) candado_stats[candado] = 0;
                    candado_stats[candado]++;
            }

            if (r.parametro === "CITV00012") {
                const vehiculo = r.vehiculo || "Sin Vehículo";
                const v = parseFloat(r.resultados);

                // Solo agregar si es un número real
                if (!isNaN(v)) {
                    temp_series.push({
                        fecha:     r.fecha,
                        hora:      r.hora,
                        vehiculo:  vehiculo,
                        valor:     v,
                        min:       parseFloat(r.valor_minimo),
                        max:       parseFloat(r.valor_maximo),
                        form:      r.name
                    });
                    temp_vehiculos.add(vehiculo);
                }
            }

            // ---- Agrupaciones generales ----
            if (!dept_stats[dept]) dept_stats[dept] = { suma: 0, total: 0, fallas: 0 };
            dept_stats[dept].suma += flt(r.total || 0);
            dept_stats[dept].total++;

            if (!trend_stats[fecha])  trend_stats[fecha] = 0;
            if (!gender_stats[gen])   gender_stats[gen]  = 0;
            if (!status_stats[status]) status_stats[status] = 0;
            if (!tipo_porducto_stats[tipo_producto]) tipo_porducto_stats[tipo_producto] = 0;
            if (!tipo_vehiculo_stats[tipo_vehiculo]) tipo_vehiculo_stats[tipo_vehiculo] = 0;

            // ---- KPI dinámico por parámetro ----
            // Se crea la llave "al vuelo" la primera vez que aparece el parámetro
            if (!defect_stats[parametro]) defect_stats[parametro] = 0;
            if (!kpi_placa_stats[vehiculo]) kpi_placa_stats[vehiculo] = 0;

            // Cuenta sólo cuando NO cumple
            if (cumplimiento === "No Cumple" || cumplimiento === "No Conforme") {
                defect_stats[parametro]++;
                kpi_placa_stats[vehiculo]++;
                dept_stats[dept].fallas++;
                trend_stats[fecha]++;
                gender_stats[gen]++;
                tipo_porducto_stats[tipo_producto]++;
                tipo_vehiculo_stats[tipo_vehiculo]++;
            }
            status_stats[status]++;
        });

        temp_series.sort((a, b) => {
            const ka = `${a.fecha} ${a.hora || "00:00:00"}`;
            const kb = `${b.fecha} ${b.hora || "00:00:00"}`;
            return ka.localeCompare(kb);
        });

        // (Opcional) ordenar alfabéticamente las tarjetas KPI
        // Si prefieres el orden de aparición en el query, comenta estas 3 líneas.
        const ordenado = {};
        Object.keys(defect_stats).sort().forEach(k => ordenado[k] = defect_stats[k]);
        defect_stats = ordenado;

        return { dept_stats, defect_stats, trend_stats, 
                gender_stats, status_stats , tipo_porducto_stats, 
                kpi_placa_stats, tipo_vehiculo_stats, candado_stats,
                temp_series, temp_vehiculos: Array.from(temp_vehiculos).sort()};
    },

    render_kpis: function(container, stats, options) {
        options = options || {};
        const subtitulo = options.subtitulo || "Incidentes";
        const icono     = options.icono     || "";

        const kpi_wrapper = document.createElement("div");
        kpi_wrapper.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
            margin-bottom: 25px;
        `;

        Object.keys(stats).forEach(label => {
            const count    = stats[label];
            const color    = count > 0 ? "#ff5858" : "#28a745";
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
                <div style="font-size: 11px; font-weight: bold; color: #525252; text-transform: uppercase; margin-bottom: 5px;">
                    ${icono} ${label}
                </div>
                <div style="font-size: 24px; font-weight: bold; color: ${color};">${count}</div>
                <div style="font-size: 10px; color: #8d99a6;">${subtitulo}</div>
            `;
            kpi_wrapper.appendChild(card);
        });

        container.appendChild(kpi_wrapper);
    },
    render_kpis_placas: function(container, kpi_placa_stats) {
        this.render_kpis(container, kpi_placa_stats, {
            subtitulo: "Incidentes",
            icono: "🚚"
        });
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

    render_product_pie_chart: function(container, gender_stats) {

        const card = createChartCard(
            container,
            "Incidentes por producto"
        );

        const labels = Object.keys(gender_stats);
        const values = labels.map(g => gender_stats[g]);

        // new frappe.Chart("#gender-incident-pie", {
        const chart = new frappe.Chart(card.body,{  
            title: "Incidentes por tipo producto",
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
            exportSVG(chart,"Indicentes_por_producto");
    },
    render_tipo_vehiculo_pie_chart: function(container, gender_stats) {

        const card = createChartCard(
            container,
            "Incidentes por producto"
        );

        const labels = Object.keys(gender_stats);
        const values = labels.map(g => gender_stats[g]);

        // new frappe.Chart("#gender-incident-pie", {
        const chart = new frappe.Chart(card.body,{  
            title: "Incidentes por tipo de vehiculo",
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
            exportSVG(chart,"Indicenes por tipo de vehiculo");
    },
    render_candado_pie_chart: function(container, gender_stats) {

        const card = createChartCard(
            container,
            "Vehiculos con candado"
        );

        const labels = Object.keys(gender_stats);
        const values = labels.map(g => gender_stats[g]);

        // new frappe.Chart("#gender-incident-pie", {
        const chart = new frappe.Chart(card.body,{  
            title: "Vehiculos con candado",
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
            exportSVG(chart,"Vehiculos con candado");
    },
    render_temp_trend_chart: function(container, temp_series, temp_vehiculos) {

        if (!temp_series || temp_series.length === 0) return;

        const card = createChartCard(container, "Tendencia de Temperatura por Vehículo");

        // ── Selector ──
        const selector = document.createElement("select");
        selector.className = "form-control";
        selector.style.cssText = "width: 220px; margin-bottom: 12px; display: inline-block;";
        selector.innerHTML = `
            <option value="__ALL__">🚚 Todos los vehículos</option>
            ${temp_vehiculos.map(v => `<option value="${v}">${v}</option>`).join("")}
        `;

        // Contenedor del chart (se reemplaza al filtrar)
        const chart_body = document.createElement("div");

        card.body.appendChild(selector);
        card.body.appendChild(chart_body);

        let chart = null;

        // Paleta: si hay muchos vehículos, se cicla
        const PALETA = [
            '#5e64ff', '#ff5858', '#28a745', '#ffa00a',
            '#00b894', '#e17055', '#6c5ce7', '#0984e3',
            '#d63031', '#fdcb6e', '#00cec9', '#e84393'
        ];
        const pintarChart = (filtro) => {
            const mostrar = (filtro === "__ALL__") ? temp_vehiculos : [filtro];
            const datos = temp_series.filter(s => mostrar.includes(s.vehiculo));
            if (datos.length === 0) return;

            const etiquetas = [...new Set(
                datos.map(s => `${s.fecha} ${s.hora ? s.hora.slice(0,5) : ""}`.trim())
            )].sort();

            const datasets = mostrar.map((veh, i) => {
                const valores = etiquetas.map(et => {
                    const m = datos.find(s =>
                        `${s.fecha} ${s.hora ? s.hora.slice(0,5) : ""}`.trim() === et &&
                        s.vehiculo === veh
                    );
                    // Number() en lugar de flt() para garantizar negativo
                    return m ? Number(m.valor) : null;
                });
                return { name: veh, chartType: "line", values: valores };
            });

            // ── Rango real del eje Y ──
            const numericos = datos
                .map(s => Number(s.valor))
                .filter(v => !isNaN(v));

            let yMin = Math.min(...numericos);
            let yMax = Math.max(...numericos);

            // Margen del 10% arriba y abajo para que la línea no toque los bordes
            const rango = (yMax - yMin) || 1;   // evita 0 si todos los valores son iguales
            const margen = rango * 0.1;
            yMin = yMin - margen;
            yMax = yMax + margen;

            chart_body.innerHTML = "";
            chart = new frappe.Chart(chart_body, {
                title: filtro === "__ALL__"
                    ? "Todas las lecturas"
                    : `Vehículo ${filtro}`,
                data: { labels: etiquetas, datasets: datasets },
                type: 'line',
                height: 300,
                colors: mostrar.map((_, i) => PALETA[i % PALETA.length]),
                lineOptions: {
                    regionFill: 0,       // sin relleno → no importa el signo
                    hideDots: 0
                },
                axisOptions: {
                    xIsSeries: true,
                    yMin: yMin,          // ← AQUÍ está la clave
                    yMax: yMax
                }
            });
        };

        // Render inicial + listener
        pintarChart("__ALL__");
        selector.onchange = () => pintarChart(selector.value);

        // Exportar siempre exporta el estado actual
        card.button.onclick = () => {
            const nombre = selector.value === "__ALL__"
                ? "Temperatura_Todos"
                : `Temperatura_${selector.value}`;
            exportSVG(chart, nombre);
        };
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
