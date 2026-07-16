import {
  createListResource,
  createResource,
  createDocumentResource,
} from 'frappe-ui'

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

export function useParoList() {
  return createListResource({
    doctype: DOCTYPE,
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
    pageLength: 20,
    auto: true,
  })
}

export function useParoDoc(name) {
  return createDocumentResource({
    doctype: DOCTYPE,
    name,
    auto: true,
  })
}

export function createParoDoc() {
  return createResource({
    url: 'frappe.client.insert',
    makeParams(values) {
      return { doc: values }
    },
  })
}

export function saveParoDoc() {
  return createResource({
    url: 'frappe.client.save',
    makeParams(doc) {
      return { doc }
    },
  })
}

export function submitParoDoc() {
  return createResource({
    url: 'frappe.client.submit',
    makeParams(doc) {
      return { doc }
    },
  })
}

export function cancelParoDoc() {
  return createResource({
    url: 'frappe.client.cancel',
    makeParams({ doctype, name }) {
      return { doctype, name }
    },
  })
}
