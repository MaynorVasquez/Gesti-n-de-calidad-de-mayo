frappe.query_reports["Análisis de Tendencia QC"] = {
    "filters": [
        // Los filtros se cargan del JSON automáticamente
    ],
    "onload": function(report) {
        // Al cargar, personalizamos el renderizado
        report.page.add_inner_button(__("Refrescar Gráficas"), () => report.refresh());
    },
    "render_graph": function(values, data, chart_data) {
        // Limpiamos el área de gráficas anterior
        $(report.chart_area).empty();

        if (chart_data && chart_data.is_dynamic) {
            Object.keys(chart_data.summary).forEach(param => {
                let chart_config = {
                    title: param,
                    data: {
                        labels: chart_data.summary[param].labels,
                        datasets: [{ values: chart_data.summary[param].values }]
                    },
                    type: 'line',
                    height: 200
                };
                
                // Creamos un div para cada gráfica
                let $chart_container = $('<div class="custom-chart-wrapper" style="margin-bottom: 30px;"></div>')
                    .appendTo(report.chart_area);
                
                new frappe.Chart($chart_container[0], chart_config);
            });
        }
    }
};