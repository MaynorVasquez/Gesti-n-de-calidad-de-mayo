// Copyright (c) 2026, Maynor Vasquez
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

        // ==========================================================
        // PRODUCTOS
        // ==========================================================
        {
            "fieldname": "producto",
            "label": __("Seleccionar Productos"),
            "fieldtype": "MultiSelectList",
            "options": "QC Template",
            "reqd": 1,

            "get_data": function(txt) {
                return frappe.db.get_link_options(
                    "QC Template",
                    txt
                );
            },

            "on_change": function() {

                const productos =
                    frappe.query_report.get_filter_value("producto");

                if (!productos || !productos.length) {

                    frappe.query_report.set_filter_value(
                        "nombre_producto",
                        ""
                    );

                    return;
                }

                frappe.call({
                    method: "frappe.client.get_list",

                    args: {
                        doctype: "QC Template",

                        filters: {
                            name: ["in", productos]
                        },

                        fields: [
                            "name",
                            "nombre_producto"
                        ],

                        limit_page_length: 0
                    },

                    callback: function(r) {

                        if (r.message) {

                            const nombres = r.message
                                .map(row => row.nombre_producto)
                                .filter(Boolean);

                            frappe.query_report.set_filter_value(
                                "nombre_producto",
                                nombres.join(", ")
                            );
                        }
                    }
                });
            }
        },


        // ==========================================================
        // NOMBRE PRODUCTO
        // ==========================================================
        {
            "fieldname": "nombre_producto",
            "label": __("Producto"),
            "fieldtype": "Data",
            "read_only": 1
        },


        // ==========================================================
        // FECHA INICIO
        // ==========================================================
        {
            "fieldname": "fecha_inicio",
            "label": __("Fecha de Inicio"),
            "fieldtype": "Date",
            "default": frappe.datetime.month_start()
        },


        // ==========================================================
        // FECHA FIN
        // ==========================================================
        {
            "fieldname": "fecha_fin",
            "label": __("Fecha de Fin"),
            "fieldtype": "Date",
            "default": frappe.datetime.month_end()
        },


        // ==========================================================
        // PARAMETRO
        // ==========================================================
        {
            "fieldname": "parametro",
            "label": __("Parámetro"),
            "fieldtype": "Link",
            "options": "QC Parametro",

            "on_change": function() {
                frappe.query_report.refresh();
            }
        }
    ],


    // ==============================================================
    // GRAFICAS
    // ==============================================================
    "after_datatable_render": function(report) {

        const rows = report.datamanager.data;


        // ----------------------------------------------------------
        // Si no existen datos
        // ----------------------------------------------------------
        if (!rows || !rows.length) {

            const old_area =
                report.wrapper.querySelector(
                    ".custom-charts-section"
                );

            if (old_area) {
                old_area.innerHTML = "";
            }

            return;
        }


        // ----------------------------------------------------------
        // Contenedor de gráficas
        // ----------------------------------------------------------
        let area =
            report.wrapper.querySelector(
                ".custom-charts-section"
            );


        if (!area) {

            area = document.createElement("div");

            area.className =
                "custom-charts-section";

            report.wrapper.prepend(area);
        }


        // Limpiar gráficas anteriores
        area.innerHTML = "";


        // ==========================================================
        // AGRUPAR DATOS
        //
        // parametro
        //      └── productos
        //             └── fecha/hora
        // ==========================================================

        const grouped = {};


        rows.forEach(r => {

            const parametro = r.parametro;

            if (!parametro) {
                return;
            }


            // ------------------------------------------------------
            // Crear estructura del parámetro
            // ------------------------------------------------------
            if (!grouped[parametro]) {

                grouped[parametro] = {

                    tipo: r.tipo_parametro,

                    productos: {},

                    // Fechas/hora generales del parámetro
                    fechas: new Set(),

                    // Para parámetros de selección
                    conteo_seleccion: {}
                };
            }


            // ======================================================
            // PARAMETRO NUMERICO
            // ======================================================
            if (r.tipo_parametro === "Número") {

                // --------------------------------------------------
                // Identificador del producto
                // --------------------------------------------------
                const productoKey =
                    r.qc_template ||
                    r.itemname ||
                    "Sin producto";


                const productoNombre =
                    // r.itemname ||
                    r.qc_template ||
                    "Sin producto";


                // --------------------------------------------------
                // Crear producto
                // --------------------------------------------------
                if (!grouped[parametro].productos[productoKey]) {

                    grouped[parametro].productos[productoKey] = {

                        nombre: productoNombre,

                        puntos: {}
                    };
                }


                // --------------------------------------------------
                // Fecha/hora
                //
                // Usamos una llave interna para ordenar correctamente
                // y otra etiqueta para mostrar en la gráfica.
                // --------------------------------------------------
                const fecha =
                    r.docdate || "";

                const hora =
                    r.hora_muestra || "";


                const fechaHoraKey =
                    `${fecha} ${hora}`.trim();


                if (!fechaHoraKey) {
                    return;
                }


                // Agregar fecha/hora global
                grouped[parametro].fechas.add(
                    fechaHoraKey
                );


                // --------------------------------------------------
                // Guardar punto
                // --------------------------------------------------
                grouped[parametro]
                    .productos[productoKey]
                    .puntos[fechaHoraKey] = {

                        resultado:
                            r.resultado !== null &&
                            r.resultado !== undefined &&
                            r.resultado !== ""
                                ? Number(r.resultado)
                                : null,

                        minimo:
                            r.valor_minimo !== null &&
                            r.valor_minimo !== undefined &&
                            r.valor_minimo !== ""
                                ? Number(r.valor_minimo)
                                : null,

                        maximo:
                            r.valor_maximo !== null &&
                            r.valor_maximo !== undefined &&
                            r.valor_maximo !== ""
                                ? Number(r.valor_maximo)
                                : null
                    };
            }


            // ======================================================
            // PARAMETRO DE SELECCION
            // ======================================================
            else {

                const valor =
                    r.conformidad || "Sin valor";


                grouped[parametro]
                    .conteo_seleccion[valor] =
                    (
                        grouped[parametro]
                            .conteo_seleccion[valor] || 0
                    ) + 1;
            }
        });


        // ==========================================================
        // CREAR UNA GRAFICA POR PARAMETRO
        // ==========================================================

        Object.keys(grouped).forEach(param => {

            const info = grouped[param];


            // ------------------------------------------------------
            // CARD
            // ------------------------------------------------------
            const card =
                document.createElement("div");

            card.className =
                "chart-card";

            card.style.marginBottom = "35px";
            card.style.border =
                "1px solid #d1d8dd";
            card.style.borderRadius = "8px";
            card.style.padding = "15px";
            card.style.backgroundColor = "#fff";


            // ------------------------------------------------------
            // HEADER
            // ------------------------------------------------------
            const header =
                document.createElement("div");

            header.style.display = "flex";
            header.style.justifyContent =
                "space-between";
            header.style.alignItems =
                "center";
            header.style.marginBottom =
                "15px";


            // ------------------------------------------------------
            // TITULO
            // ------------------------------------------------------
            const title =
                document.createElement("h5");

            title.innerText = param;
            title.style.margin = "0";


            // ------------------------------------------------------
            // BOTON EXPORTAR
            // ------------------------------------------------------
            const btn =
                document.createElement("button");

            btn.className =
                "btn btn-default btn-xs";

            btn.innerHTML =
                '<i class="fa fa-download"></i> Exportar gráfica';


            header.appendChild(title);
            header.appendChild(btn);


            // ------------------------------------------------------
            // WRAPPER
            // ------------------------------------------------------
            const wrapper =
                document.createElement("div");

            wrapper.style.height = "320px";


            card.appendChild(header);
            card.appendChild(wrapper);

            area.appendChild(card);


            // ======================================================
            // GRAFICA NUMERICA
            // ======================================================
            if (info.tipo === "Número") {


                // --------------------------------------------------
                // Obtener fechas únicas y ordenarlas
                // --------------------------------------------------
                const fechaKeys =
                    Array.from(info.fechas)
                    .sort();


                // --------------------------------------------------
                // Convertir fecha interna a etiqueta visible
                //
                // YYYY-MM-DD HH:mm:ss
                //        ↓
                // DD/MM HH:mm
                // --------------------------------------------------
                const labels =
                    fechaKeys.map(key => {

                        const partes =
                            key.split(" ");

                        const fecha =
                            partes[0] || "";

                        const hora =
                            partes[1] || "";


                        if (!fecha) {
                            return "";
                        }


                        const fechaPartes =
                            fecha.split("-");


                        if (fechaPartes.length !== 3) {
                            return key;
                        }


                        const dia =
                            fechaPartes[2];

                        const mes =
                            fechaPartes[1];


                        const horaCorta =
                            hora
                                ? hora.substring(0, 5)
                                : "";


                        return horaCorta
                            ? `${dia}/${mes} ${horaCorta}`
                            : `${dia}/${mes}`;
                    });


                // --------------------------------------------------
                // DATASETS
                // --------------------------------------------------
                const datasets = [];


                // --------------------------------------------------
                // Variables para saber si los límites son iguales
                // para todos los productos
                // --------------------------------------------------
                let limitesIguales = true;

                let valoresMinimos = null;
                let valoresMaximos = null;


                // ==================================================
                // UNA LINEA POR PRODUCTO
                // ==================================================
                Object.keys(info.productos)
                    .forEach(productoKey => {

                        const producto =
                            info.productos[
                                productoKey
                            ];


                        // ------------------------------------------
                        // Valores de resultado
                        // ------------------------------------------
                        const resultados =
                            fechaKeys.map(
                                fechaHora => {

                                    const punto =
                                        producto.puntos[
                                            fechaHora
                                        ];

                                    return punto
                                        ? punto.resultado
                                        : null;
                                }
                            );


                        datasets.push({

                            name: producto.nombre,

                            values: resultados
                        });


                        // ------------------------------------------
                        // Obtener mínimos/máximos
                        // ------------------------------------------
                        const mins =
                            fechaKeys.map(
                                fechaHora => {

                                    const punto =
                                        producto.puntos[
                                            fechaHora
                                        ];

                                    return punto
                                        ? punto.minimo
                                        : null;
                                }
                            );


                        const maxs =
                            fechaKeys.map(
                                fechaHora => {

                                    const punto =
                                        producto.puntos[
                                            fechaHora
                                        ];

                                    return punto
                                        ? punto.maximo
                                        : null;
                                }
                            );


                        // ------------------------------------------
                        // Primer producto
                        // ------------------------------------------
                        if (
                            valoresMinimos === null
                        ) {

                            valoresMinimos =
                                mins;

                            valoresMaximos =
                                maxs;

                        } else {

                            // --------------------------------------
                            // Comparar límites
                            // --------------------------------------
                            for (
                                let i = 0;
                                i < fechaKeys.length;
                                i++
                            ) {

                                if (
                                    valoresMinimos[i] !== mins[i] ||
                                    valoresMaximos[i] !== maxs[i]
                                ) {

                                    limitesIguales =
                                        false;

                                    break;
                                }
                            }
                        }
                    });


                // ==================================================
                // AGREGAR MINIMO / MAXIMO
                //
                // Solo si todos los productos utilizan los mismos
                // límites.
                // ==================================================
                if (
                    limitesIguales &&
                    valoresMinimos &&
                    valoresMaximos
                ) {

                    datasets.push({

                        name: "Mínimo",

                        values:
                            valoresMinimos
                    });


                    datasets.push({

                        name: "Máximo",

                        values:
                            valoresMaximos
                    });
                }


                // ==================================================
                // CREAR CHART
                // ==================================================
                const chart =
                    new frappe.Chart(wrapper, {

                        title: param,

                        data: {

                            labels: labels,

                            datasets: datasets
                        },

                        type: "line",

                        height: 350,

                        lineOptions: {

                            regionFill: 0,

                            hideDots: 0,

                            spline: 0
                        },

                        axisOptions: {

                            xAxisMode: "tick",

                            yAxisMode: "span",

                            xIsSeries: 1
                        },

                        tooltipOptions: {

                            formatTooltipX:
                                d => d,

                            formatTooltipY:
                                d => {

                                    if (
                                        d === null ||
                                        d === undefined
                                    ) {
                                        return "";
                                    }

                                    return Number(d)
                                        .toFixed(2);
                                }
                        }
                    });


                // --------------------------------------------------
                // Exportar
                // --------------------------------------------------
                btn.onclick = () => {

                    const filename =
                        `Tendencia_${param}`
                        .replace(
                            /[^a-zA-Z0-9_-]/g,
                            "_"
                        );

                    exportSVG(
                        chart,
                        filename
                    );
                };


                // --------------------------------------------------
                // Aviso si los límites son diferentes
                // --------------------------------------------------
                if (!limitesIguales) {

                    const aviso =
                        document.createElement("div");

                    aviso.style.fontSize =
                        "11px";

                    aviso.style.color =
                        "#888";

                    aviso.style.marginTop =
                        "5px";

                    aviso.innerText =
                        "Los límites mínimo y máximo varían entre productos; no se muestran como líneas generales.";

                    card.appendChild(aviso);
                }
            }


            // ======================================================
            // PARAMETRO DE SELECCION
            // ======================================================
            else {

                const pie_labels =
                    Object.keys(
                        info.conteo_seleccion
                    );


                const pie_values =
                    Object.values(
                        info.conteo_seleccion
                    );


                const total =
                    pie_values.reduce(
                        (a, b) => a + b,
                        0
                    );


                const chart =
                    new frappe.Chart(wrapper, {

                        title:
                            `${param} (Total: ${total} muestras)`,

                        data: {

                            labels:
                                pie_labels,

                            datasets: [

                                {
                                    name:
                                        "Conformidad",

                                    values:
                                        pie_values
                                }
                            ]
                        },

                        type: "percentage",

                        height: 300,

                        colors: [
                            "#28a745",
                            "#ff5858",
                            "#ffa00a"
                        ],

                        barOptions: {

                            height: 40,

                            depth: 2
                        },

                        tooltipOptions: {

                            formatTooltipY:
                                d => {

                                    return (
                                        (
                                            d / total
                                        ) * 100
                                    ).toFixed(1)
                                    + "% ("
                                    + d
                                    + ")";
                                }
                        }
                    });


                btn.onclick = () => {

                    const filename =
                        `Tendencia_${param}`
                        .replace(
                            /[^a-zA-Z0-9_-]/g,
                            "_"
                        );

                    exportSVG(
                        chart,
                        filename
                    );
                };
            }
        });
    }
};