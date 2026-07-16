import { makeDocResources } from './common'

const DOCTYPE = 'QC Paros de Produccion'

export const PARO_DOCTYPE = DOCTYPE

// Opciones del campo Select "status" del doctype
export const PARO_STATUSES = [
  'Draft',
  'Pendiente de Aprobación',
  'Aprobado',
  'Rechazado',
  'Cerrado',
  'Cancelado',
]

// El valor almacenado es "Draft"; Desk lo muestra traducido como "Borrador"
export function paroStatusLabel(s) {
  if (!s) return '—'
  return s === 'Draft' ? 'Borrador' : s
}

export function paroStatusClass(s) {
  if (s === 'Aprobado') return 'badge-green'
  if (s === 'Pendiente de Aprobación') return 'badge-yellow'
  if (s === 'Rechazado' || s === 'Cancelado') return 'badge-red'
  if (s === 'Cerrado') return 'badge-blue'
  return 'badge-gray'
}

const paros = makeDocResources(DOCTYPE, {
  fields: [
    'name',
    'qc_producto',
    'itemname',
    'docdate',
    'hora',
    'status',
    'docstatus',
  ],
  orderBy: 'docdate desc, hora desc',
})

export const paroResources = paros

export const useParoList = (opts) => paros.useList(opts)
export const useParoDoc = (name) => paros.useDoc(name)
export const createParoDoc = () => paros.create()
export const saveParoDoc = () => paros.save()
export const submitParoDoc = () => paros.submit()
export const cancelParoDoc = () => paros.cancel()
