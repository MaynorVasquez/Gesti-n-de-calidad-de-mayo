import { makeDocResources } from './common'
import { useEmployees, useAreas } from './lookups'

const atp = makeDocResources('QC Lavado de Manos ATP', {
  fields: [
    'name',
    'fecha_inspeccion',
    'hora_inspeccion',
    'supervisor',
    'docstatus',
  ],
  orderBy: 'fecha_inspeccion desc, hora_inspeccion desc',
})

export const atpResources = atp
export const ATP_DOCTYPE = atp.doctype

export const useATPList = (opts) => atp.useList(opts)
export const useATPDoc = (name) => atp.useDoc(name)
export const createATPDoc = () => atp.create()
export const submitATPDoc = () => atp.submit()
export const cancelATPDoc = () => atp.cancel()

export { useEmployees, useAreas }
