<template>
  <div>
    <PageHeader
      title="Paros de Producción"
      subtitle="Registro de paros durante el control de calidad"
    >
      <template #actions>
        <button
          @click="paros.reload()"
          class="btn-ghost"
          :disabled="paros.list.loading"
          title="Recargar"
        >
          <IconRefresh
            class="w-4 h-4"
            :class="{ 'animate-spin': paros.list.loading }"
          />
        </button>
        <router-link to="/paros/new" class="btn-primary">
          <IconPlus class="w-4 h-4" />
          Nuevo paro
        </router-link>
      </template>
    </PageHeader>

    <div class="px-4 sm:px-6 lg:px-10 py-6">
      <div class="flex items-end gap-2 mb-4 flex-wrap">
        <div class="relative flex-1 min-w-[180px] sm:min-w-[220px] max-w-sm">
          <IconSearch
            class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por folio, producto o control…"
            class="input pl-8"
          />
        </div>

        <div>
          <label class="field-label">Desde</label>
          <input v-model="dateFrom" type="date" class="input w-40" />
        </div>
        <div>
          <label class="field-label">Hasta</label>
          <input v-model="dateTo" type="date" class="input w-40" />
        </div>
        <div>
          <label class="field-label">Estado</label>
          <select v-model="statusFilter" class="select w-36">
            <option value="">Todos</option>
            <option value="0">Borrador</option>
            <option value="1">Enviado</option>
            <option value="2">Cancelado</option>
          </select>
        </div>
        <div>
          <label class="field-label">Status</label>
          <select v-model="paroStatusFilter" class="select w-48">
            <option value="">Todos</option>
            <option v-for="s in PARO_STATUSES" :key="s" :value="s">
              {{ paroStatusLabel(s) }}
            </option>
          </select>
        </div>

        <button
          v-if="hasFilters"
          @click="clearFilters"
          class="btn-ghost"
          title="Limpiar filtros"
        >
          <IconX class="w-4 h-4" />
          Limpiar
        </button>

        <div class="flex-1" />
        <div class="text-xs text-gray-500 pb-2">
          {{ filtered.length }}
          {{ filtered.length === 1 ? 'paro' : 'paros' }}
        </div>
      </div>

      <div
        v-if="paros.list.loading && !paros.data"
        class="card p-12 text-center text-gray-500 text-sm"
      >
        <IconLoader class="w-5 h-5 mx-auto mb-2 animate-spin" />
        Cargando…
      </div>

      <div v-else-if="!filtered.length" class="card p-12 text-center">
        <div
          class="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3"
        >
          <IconPause class="w-6 h-6" />
        </div>
        <div class="text-sm font-medium text-gray-700 mb-1">
          {{ paros.data?.length ? 'Sin resultados' : 'Aún no hay paros registrados' }}
        </div>
        <div class="text-xs text-gray-500 mb-4">
          {{
            paros.data?.length
              ? 'Probá con otros filtros o términos de búsqueda.'
              : 'Registra un paro de producción sobre un control de calidad abierto.'
          }}
        </div>
        <router-link
          v-if="!paros.data?.length"
          to="/paros/new"
          class="btn-primary"
        >
          <IconPlus class="w-4 h-4" />
          Nuevo paro
        </router-link>
      </div>

      <div v-else>
        <div class="card overflow-hidden hidden md:block">
          <table class="w-full text-sm">
            <thead>
              <tr
                class="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500"
              >
                <th class="px-4 py-2.5 font-medium">Folio</th>
                <th class="px-4 py-2.5 font-medium">Producto</th>
                <th class="px-4 py-2.5 font-medium">Control</th>
                <th class="px-4 py-2.5 font-medium">Fecha</th>
                <th class="px-4 py-2.5 font-medium">Hora</th>
                <th class="px-4 py-2.5 font-medium">Status</th>
                <th class="px-4 py-2.5 font-medium">Estado</th>
                <th class="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filtered"
                :key="row.name"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition cursor-pointer group"
                @click="$router.push(`/paros/${encodeURIComponent(row.name)}`)"
              >
                <td class="px-4 py-2.5 font-mono text-xs text-gray-700">
                  {{ row.name }}
                </td>
                <td class="px-4 py-2.5 text-gray-700">
                  {{ row.itemname || '—' }}
                </td>
                <td class="px-4 py-2.5 text-gray-600 font-mono text-xs">
                  {{ row.qc_producto || '—' }}
                </td>
                <td class="px-4 py-2.5 text-gray-700">
                  {{ formatDate(row.docdate) }}
                </td>
                <td class="px-4 py-2.5 text-gray-600">
                  {{ formatTime(row.hora) }}
                </td>
                <td class="px-4 py-2.5">
                  <span class="badge" :class="paroStatusClass(row.status)">
                    {{ paroStatusLabel(row.status) }}
                  </span>
                </td>
                <td class="px-4 py-2.5">
                  <span class="badge" :class="docstatusClass(row.docstatus)">
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="dotClass(row.docstatus)"
                    />
                    {{ docstatusLabel(row.docstatus) }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-right">
                  <IconChevronRight
                    class="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="md:hidden space-y-2">
          <li
            v-for="row in filtered"
            :key="row.name"
            class="card p-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50/70 transition"
            @click="$router.push(`/paros/${encodeURIComponent(row.name)}`)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-mono text-xs text-gray-700 truncate">
                  {{ row.name }}
                </span>
                <span
                  class="badge shrink-0"
                  :class="docstatusClass(row.docstatus)"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="dotClass(row.docstatus)"
                  />
                  {{ docstatusLabel(row.docstatus) }}
                </span>
              </div>
              <div class="text-sm text-gray-900 truncate">
                {{ row.itemname || '—' }}
              </div>
              <div class="text-xs text-gray-500 mt-0.5">
                {{ row.qc_producto || '—' }} ·
                {{ formatDate(row.docdate) }} ·
                {{ formatTime(row.hora) }}
              </div>
              <div class="mt-1.5">
                <span class="badge" :class="paroStatusClass(row.status)">
                  {{ paroStatusLabel(row.status) }}
                </span>
              </div>
            </div>
            <IconChevronRight class="w-4 h-4 text-gray-300 mt-1 shrink-0" />
          </li>
        </ul>
        <Pagination
          :count="paros.data?.length || 0"
          :has-more="!!paros.hasNextPage"
          :loading="paros.list.loading"
          :page-size="pageSize"
          @update:page-size="setPageSize"
          @load-more="paros.next()"
          item-singular="paro"
          item-plural="paros"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  useParoList,
  PARO_STATUSES,
  paroStatusClass,
  paroStatusLabel,
} from '@/data/paros'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import IconPlus from '~icons/lucide/plus'
import IconRefresh from '~icons/lucide/refresh-cw'
import IconSearch from '~icons/lucide/search'
import IconLoader from '~icons/lucide/loader-circle'
import IconPause from '~icons/lucide/circle-pause'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconX from '~icons/lucide/x'

const paros = useParoList()
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const statusFilter = ref('')
const paroStatusFilter = ref('')
const pageSize = ref(20)

function setPageSize(s) {
  pageSize.value = s
  paros.update({ pageLength: s })
}

const hasFilters = computed(
  () =>
    !!search.value ||
    !!dateFrom.value ||
    !!dateTo.value ||
    statusFilter.value !== '' ||
    paroStatusFilter.value !== ''
)

watch([dateFrom, dateTo, statusFilter, paroStatusFilter], () => {
  const filters = []
  if (dateFrom.value) filters.push(['docdate', '>=', dateFrom.value])
  if (dateTo.value) filters.push(['docdate', '<=', dateTo.value])
  if (statusFilter.value !== '')
    filters.push(['docstatus', '=', Number(statusFilter.value)])
  if (paroStatusFilter.value !== '')
    filters.push(['status', '=', paroStatusFilter.value])
  paros.update({ filters })
})

function clearFilters() {
  search.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  statusFilter.value = ''
  paroStatusFilter.value = ''
}

const filtered = computed(() => {
  const list = paros.data || []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (r) =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.itemname || '').toLowerCase().includes(q) ||
      (r.qc_producto || '').toLowerCase().includes(q)
  )
})

function docstatusLabel(s) {
  if (s === 1) return 'Enviado'
  if (s === 2) return 'Cancelado'
  return 'Borrador'
}
function docstatusClass(s) {
  if (s === 1) return 'badge-green'
  if (s === 2) return 'badge-red'
  return 'badge-yellow'
}
function dotClass(s) {
  if (s === 1) return 'bg-green-500'
  if (s === 2) return 'bg-red-500'
  return 'bg-yellow-500'
}
function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).split('-')
  if (!y || !m || !day) return d
  return `${day}/${m}/${y}`
}
function formatTime(t) {
  if (!t) return '—'
  return String(t).slice(0, 5)
}
</script>
