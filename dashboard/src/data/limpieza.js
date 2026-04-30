import {
  createListResource,
  createResource,
  createDocumentResource,
} from 'frappe-ui'

const DOCTYPE = 'QC Orden y Limpieza'
const TABLE_FIELD = 'listado_areas'

export const LIMPIEZA_DOCTYPE = DOCTYPE
export const LIMPIEZA_TABLE_FIELD = TABLE_FIELD

export const LIMPIEZA_CRITERIA = [
  { key: 'or', resultKey: 'or_resultado', label: 'Orden' },
  { key: 'ppt', resultKey: 'ppt_resultado', label: 'Piso, paredes y techo' },
  { key: 'eu', resultKey: 'eu_resultado', label: 'Equipos y utensilios' },
  {
    key: 'elm',
    resultKey: 'elm_resultado',
    label: 'Estación de limpieza y lavado de manos',
  },
  { key: 'bs', resultKey: 'bs_resultado', label: 'Basureros' },
  { key: 'ep', resultKey: 'ep_resultado', label: 'Evidencia de plagas' },
]

export function newLimpiezaRow() {
  const row = {
    area: '',
    departamento: '',
    nombre_responsable: '',
    firma_responsable: '',
    observaciones: '',
    acciones_correctivas: '',
    fecha_cierre: '',
    resultado: 0,
  }
  for (const c of LIMPIEZA_CRITERIA) {
    row[c.key] = 'Conforme'
    row[c.resultKey] = 100
  }
  return row
}

export function rowAverage(row) {
  const values = LIMPIEZA_CRITERIA.map((c) => Number(row[c.resultKey])).filter(
    (v) => Number.isFinite(v)
  )
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function rowSummary(row) {
  let conformes = 0
  let noConformes = 0
  for (const c of LIMPIEZA_CRITERIA) {
    const v = row[c.key]
    if (v === 'Conforme') conformes++
    else if (v === 'No Conforme') noConformes++
  }
  return { conformes, noConformes, total: LIMPIEZA_CRITERIA.length }
}

export function totalAverage(rows) {
  if (!rows?.length) return 0
  const sum = rows.reduce((acc, r) => acc + rowAverage(r), 0)
  return sum / rows.length
}

export function useOLList() {
  return createListResource({
    doctype: DOCTYPE,
    fields: [
      'name',
      'fecha_inspeccion',
      'hora_inspeccion',
      'full_user_name',
      'total',
      'docstatus',
    ],
    orderBy: 'fecha_inspeccion desc, hora_inspeccion desc',
    pageLength: 20,
    auto: true,
  })
}

export function useOLDoc(name) {
  return createDocumentResource({
    doctype: DOCTYPE,
    name,
    auto: true,
  })
}

export function createOLDoc() {
  return createResource({
    url: 'frappe.client.insert',
    makeParams(values) {
      return { doc: values }
    },
  })
}

export function submitOLDoc() {
  return createResource({
    url: 'frappe.client.submit',
    makeParams(doc) {
      return { doc }
    },
  })
}

export function cancelOLDoc() {
  return createResource({
    url: 'frappe.client.cancel',
    makeParams({ doctype, name }) {
      return { doctype, name }
    },
  })
}

export function useAreasWithDept() {
  return createListResource({
    doctype: 'QC Area de limpieza',
    fields: ['name', 'departamento'],
    pageLength: 200,
    orderBy: 'name asc',
    auto: true,
  })
}
