import {
  createListResource,
  createResource,
  createDocumentResource,
} from 'frappe-ui'

const DOCTYPE = 'QC Lavado de Manos ATP'

export function useATPList() {
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

export function useATPDoc(name) {
  return createDocumentResource({
    doctype: DOCTYPE,
    name,
    auto: true,
  })
}

export function createATPDoc() {
  return createResource({
    url: 'frappe.client.insert',
    makeParams(values) {
      return { doc: values }
    },
  })
}

export function submitATPDoc() {
  return createResource({
    url: 'frappe.client.submit',
    makeParams(doc) {
      return { doc }
    },
  })
}

export function cancelATPDoc() {
  return createResource({
    url: 'frappe.client.cancel',
    makeParams({ doctype, name }) {
      return { doctype, name }
    },
  })
}

export function useEmployees() {
  return createListResource({
    doctype: 'Employee',
    fields: ['name', 'employee_name', 'department'],
    filters: { status: 'Active' },
    pageLength: 200,
    orderBy: 'employee_name asc',
    auto: true,
  })
}

export function useAreas() {
  return createListResource({
    doctype: 'QC Area de limpieza',
    fields: ['name'],
    pageLength: 200,
    orderBy: 'name asc',
    auto: true,
  })
}
