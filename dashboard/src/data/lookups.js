import { createListResource, createResource } from 'frappe-ui'

// Catálogos compartidos entre módulos

export function useEmployees() {
  return createListResource({
    doctype: 'Employee',
    fields: ['name', 'employee_name', 'department', 'custom_codigo_interno'],
    filters: { status: 'Active' },
    pageLength: 5000,
    orderBy: 'employee_name asc',
    auto: true,
  })
}

export function useAreas(fields = ['name']) {
  return createListResource({
    doctype: 'QC Area de limpieza',
    fields,
    pageLength: 200,
    orderBy: 'name asc',
    auto: true,
  })
}

// QC Productos en estado "Abierto" (los únicos que aceptan muestras/paros)
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
