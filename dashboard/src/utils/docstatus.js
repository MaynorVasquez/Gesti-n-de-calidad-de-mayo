// Estado del documento (docstatus) y helpers de presentación compartidos

const DOCSTATUS = {
  0: { label: 'Borrador', badge: 'badge-yellow', dot: 'bg-yellow-500' },
  1: { label: 'Enviado', badge: 'badge-green', dot: 'bg-green-500' },
  2: { label: 'Cancelado', badge: 'badge-red', dot: 'bg-red-500' },
}

export function docstatusLabel(s) {
  return (DOCSTATUS[s] ?? DOCSTATUS[0]).label
}

export function docstatusClass(s) {
  return (DOCSTATUS[s] ?? DOCSTATUS[0]).badge
}

export function dotClass(s) {
  return (DOCSTATUS[s] ?? DOCSTATUS[0]).dot
}

// Color de puntajes de cumplimiento (umbral 90/70)
export function scoreColor(v) {
  const n = Number(v)
  if (n >= 90) return 'text-green-700'
  if (n >= 70) return 'text-yellow-700'
  return 'text-red-700'
}

// Badge de conformidad Conforme / No Conforme
export function conformidadClass(v) {
  if (v === 'Conforme') return 'badge-green'
  if (v === 'No Conforme') return 'badge-red'
  return 'badge-gray'
}

// URL del documento en Desk: deskUrl('qc-lavado-de-manos-atp', name)
export function deskUrl(slug, name) {
  return `/app/${slug}/${encodeURIComponent(name)}`
}
