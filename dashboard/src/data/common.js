import {
  createListResource,
  createResource,
  createDocumentResource,
} from 'frappe-ui'

// Fábrica de recursos CRUD para un doctype (list/doc/insert/save/submit/cancel)
export function makeDocResources(doctype, { fields, orderBy, pageLength = 20 }) {
  return {
    doctype,
    useList(opts = {}) {
      return createListResource({
        doctype,
        fields,
        orderBy,
        pageLength,
        auto: true,
        ...opts,
      })
    },
    useDoc(name) {
      return createDocumentResource({
        doctype,
        name,
        auto: true,
      })
    },
    create() {
      return createResource({
        url: 'frappe.client.insert',
        makeParams(doc) {
          return { doc }
        },
      })
    },
    save() {
      return createResource({
        url: 'frappe.client.save',
        makeParams(doc) {
          return { doc }
        },
      })
    },
    submit() {
      return createResource({
        url: 'frappe.client.submit',
        makeParams(doc) {
          return { doc }
        },
      })
    },
    cancel() {
      return createResource({
        url: 'frappe.client.cancel',
        makeParams({ doctype: dt, name }) {
          return { doctype: dt, name }
        },
      })
    },
  }
}
