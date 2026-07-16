// Formateo de fechas/horas compartido por todas las páginas

export function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).split('-')
  if (!y || !m || !day) return d
  return `${day}/${m}/${y}`
}

export function formatTime(t) {
  if (!t) return '—'
  return String(t).slice(0, 5)
}

export function formatDateTime(s) {
  if (!s) return ''
  try {
    return new Date(s).toLocaleString('es', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return s
  }
}

// Fecha/hora actuales para precargar formularios nuevos
export function nowDefaults() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${mi}:00`,
  }
}
