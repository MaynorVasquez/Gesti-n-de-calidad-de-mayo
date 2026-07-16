import {
  createListResource,
  createResource,
  createDocumentResource,
} from 'frappe-ui'

const DOCTYPE = 'QC Producto Muestra'

export const MUESTRA_DOCTYPE = DOCTYPE

export function useMuestraList() {
  return createListResource({
    doctype: DOCTYPE,
    fields: [
      'name',
      'qc_producto',
      'itemname',
      'batchnum',
      'docdate',
      'hora_muestra',
      'docstatus',
    ],
    orderBy: 'docdate desc, hora_muestra desc',
    pageLength: 20,
    auto: true,
  })
}

export function useMuestraDoc(name) {
  return createDocumentResource({
    doctype: DOCTYPE,
    name,
    auto: true,
  })
}

export function createMuestraDoc() {
  return createResource({
    url: 'frappe.client.insert',
    makeParams(values) {
      return { doc: values }
    },
  })
}

export function saveMuestraDoc() {
  return createResource({
    url: 'frappe.client.save',
    makeParams(doc) {
      return { doc }
    },
  })
}

export function submitMuestraDoc() {
  return createResource({
    url: 'frappe.client.submit',
    makeParams(doc) {
      return { doc }
    },
  })
}

export function cancelMuestraDoc() {
  return createResource({
    url: 'frappe.client.cancel',
    makeParams({ doctype, name }) {
      return { doctype, name }
    },
  })
}

// QC Productos en estado "Abierto" (los únicos que aceptan muestras)
export function useProductosAbiertos() {
  return createListResource({
    doctype: 'QC Producto',
    fields: ['name', 'itemname', 'qc_template', 'docdate'],
    filters: { status: 'Abierto' },
    orderBy: 'modified desc',
    pageLength: 100,
    auto: true,
  })
}

export function fetchTemplate() {
  return createResource({
    url: 'frappe.client.get',
    makeParams(name) {
      return { doctype: 'QC Template', name }
    },
  })
}

export function newDetalleRow(item = {}) {
  return {
    categoria: item.categoria || '',
    parametro: item.parametro || '',
    tipo_parametro: item.tipo_parametro || '',
    valor_minimo: item.valor_minimo ?? 0,
    valor_maximo: item.valor_maximo ?? 0,
    tipo_ingreso: item.tipo_ingreso || '',
    imprimir: item.imprimir || '',
    resultados: null,
    conformidad: '',
  }
}

export function hasResultado(row) {
  return (
    row.resultados !== null &&
    row.resultados !== undefined &&
    row.resultados !== ''
  )
}

export function hasRange(row) {
  return Number(row.valor_minimo) !== 0 || Number(row.valor_maximo) !== 0
}

export function fueraDeRango(row) {
  if (row.tipo_parametro !== 'Número') return false
  if (!hasResultado(row) || !hasRange(row)) return false
  const v = Number(row.resultados)
  return v < Number(row.valor_minimo) || v > Number(row.valor_maximo)
}

export function rowEvaluada(row) {
  if (row.tipo_parametro === 'Número') return hasResultado(row)
  if (row.tipo_parametro === 'Selección') return !!row.conformidad
  return false
}

export function rowConforme(row) {
  if (!rowEvaluada(row)) return null
  if (row.tipo_parametro === 'Número') return !fueraDeRango(row)
  return row.conformidad === 'Conforme'
}

export function muestraSummary(rows) {
  let conformes = 0
  let noConformes = 0
  let sinEvaluar = 0
  for (const row of rows) {
    const c = rowConforme(row)
    if (c === true) conformes++
    else if (c === false) noConformes++
    else sinEvaluar++
  }
  const evaluated = conformes + noConformes
  const percent = evaluated ? Math.round((conformes / evaluated) * 100) : 0
  return { conformes, noConformes, sinEvaluar, evaluated, percent }
}

export function groupByCategoria(rows) {
  const groups = []
  const index = {}
  for (const row of rows) {
    const key = row.categoria || 'Sin categoría'
    if (!(key in index)) {
      index[key] = groups.length
      groups.push({ categoria: key, rows: [] })
    }
    groups[index[key]].rows.push(row)
  }
  return groups
}
