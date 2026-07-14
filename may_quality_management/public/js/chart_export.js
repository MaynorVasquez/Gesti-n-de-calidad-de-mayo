
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
    btn.innerHTML = '<i class="fa fa-download"></i> SVG';

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