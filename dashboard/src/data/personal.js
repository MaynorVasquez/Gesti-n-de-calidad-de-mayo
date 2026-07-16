import { makeDocResources } from './common'
import { useEmployees } from './lookups'

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
  const row = {
    codigo_empleado: emp.name || '',
    nombre_empleado: emp.employee_name || '',
    estado: 'Activo',
    oac: '',
  }
  for (const c of PERSONAL_CRITERIA) row[c.key] = 'Conforme'
  return row
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

const personal = makeDocResources(DOCTYPE, {
  fields: [
    'name',
    'fecha_inspeccion',
    'hora_inspeccion',
    'supervisor',
    'docstatus',
  ],
  orderBy: 'fecha_inspeccion desc, hora_inspeccion desc',
})

export const personalResources = personal

export const useIPList = (opts) => personal.useList(opts)
export const useIPDoc = (name) => personal.useDoc(name)
export const createIPDoc = () => personal.create()
export const submitIPDoc = () => personal.submit()
export const cancelIPDoc = () => personal.cancel()

export { useEmployees }
