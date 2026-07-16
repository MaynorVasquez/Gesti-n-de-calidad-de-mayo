import { computed, nextTick, ref, watch } from 'vue'

// Filtros de listado compartidos: búsqueda (server-side vía or_filters),
// rango de fechas y docstatus. Todos disparan reload() — listResource.update()
// solo asigna opciones, no refetchea.
// `extraRefs` (opcional): refs adicionales que también filtran (se observan,
// se limpian con clearFilters y cuentan para hasFilters). `extraFilters`
// (opcional): función que devuelve tuplas de filtro extra para el request.
export function useListFilters(
  list,
  { dateField, searchFields = ['name'], debounceMs = 300, extraRefs = [], extraFilters }
) {
  const search = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const statusFilter = ref('')
  const pageSize = ref(20)

  const hasFilters = computed(
    () =>
      !!search.value ||
      !!dateFrom.value ||
      !!dateTo.value ||
      statusFilter.value !== '' ||
      extraRefs.some((r) => r.value !== '')
  )

  function apply() {
    const filters = []
    if (dateFrom.value) filters.push([dateField, '>=', dateFrom.value])
    if (dateTo.value) filters.push([dateField, '<=', dateTo.value])
    if (statusFilter.value !== '')
      filters.push(['docstatus', '=', Number(statusFilter.value)])
    if (extraFilters) filters.push(...extraFilters())

    const q = search.value.trim()
    const orFilters = q
      ? searchFields.map((f) => [f, 'like', `%${q}%`])
      : undefined

    list.update({ filters, orFilters, start: 0 })
    list.reload()
  }

  let timer = null
  let suppress = false

  watch(search, () => {
    if (suppress) return
    clearTimeout(timer)
    timer = setTimeout(apply, debounceMs)
  })

  watch([dateFrom, dateTo, statusFilter, ...extraRefs], () => {
    if (suppress) return
    apply()
  })

  function clearFilters() {
    clearTimeout(timer)
    suppress = true
    search.value = ''
    dateFrom.value = ''
    dateTo.value = ''
    statusFilter.value = ''
    for (const r of extraRefs) r.value = ''
    nextTick(() => {
      suppress = false
    })
    apply()
  }

  function setPageSize(s) {
    pageSize.value = s
    list.update({ pageLength: s })
    list.reload()
  }

  const rows = computed(() => list.data || [])

  return {
    search,
    dateFrom,
    dateTo,
    statusFilter,
    hasFilters,
    clearFilters,
    rows,
    pageSize,
    setPageSize,
  }
}
