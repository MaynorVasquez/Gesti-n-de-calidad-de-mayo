import {
  createListResource,
  createResource,
  createDocumentResource,
} from 'frappe-ui'
import { useEmployees } from './atp'

const DOCTYPE = 'QC Inspeccion de Personal'
const TABLE_FIELD = 'table_nnkn'

export const PERSONAL_DOCTYPE = DOCTYPE
export const PERSONAL_TABLE_FIELD = TABLE_FIELD

export const PERSONAL_CRITERIA = [
  { key: 'manos_limpias', label: 'Manos limpias' },
  { key: 'ulc', label: 'Uñas limpias y cortas' },
  { key: 'barba', label: 'Sin barba' },
  { key: 'uniforme_limpio', label: 'Uniforme limpio' },
  { key: 'redecilla', label: 'Redecilla' },
  { key: 'mascarilla', label: 'Mascarilla' },
  { key: 'maquillaje', label: 'Sin maquillaje' },
  { key: 'joyeria', label: 'Sin joyería' },
]

export function newPersonalRow(emp = {}) {
  return {
    codigo_empleado: emp.name || '',
    nombre_empleado: emp.employee_name || '',
    estado: 'Activo',
    manos_limpias: 'Conforme',
    ulc: 'Conforme',
    barba: 'Conforme',
    uniforme_limpio: 'Conforme',
    redecilla: 'Conforme',
    mascarilla: '',
    maquillaje: 'Conforme',
    joyeria: '',
    oac: '',
  }
}

export function rowConformity(row) {
  let conformes = 0
  let noConformes = 0
  for (const c of PERSONAL_CRITERIA) {
    const v = row[c.key]
    if (v === 'Conforme') conformes++
    else if (v === 'No Conforme') noConformes++
  }
  return {
    conformes,
    noConformes,
    total: PERSONAL_CRITERIA.length,
    evaluated: conformes + noConformes,
  }
}

export function useIPList() {
  return createListResource({
    doctype: DOCTYPE,
    fields: [
      'name',
      'fecha_inspeccion',
      'hora_inspeccion',
      'supervisor',
      'docstatus',
    ],
    orderBy: 'fecha_inspeccion desc, hora_inspeccion desc',
    pageLength: 20,
    auto: true,
  })
}

export function useIPDoc(name) {
  return createDocumentResource({
    doctype: DOCTYPE,
    name,
    auto: true,
  })
}

export function createIPDoc() {
  return createResource({
    url: 'frappe.client.insert',
    makeParams(values) {
      return { doc: values }
    },
  })
}

export function submitIPDoc() {
  return createResource({
    url: 'frappe.client.submit',
    makeParams(doc) {
      return { doc }
    },
  })
}

export function cancelIPDoc() {
  return createResource({
    url: 'frappe.client.cancel',
    makeParams({ doctype, name }) {
      return { doctype, name }
    },
  })
}

export { useEmployees }
