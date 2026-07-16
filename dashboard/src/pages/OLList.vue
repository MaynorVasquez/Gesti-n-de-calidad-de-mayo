<template>
  <div>
    <PageHeader
      title="Orden y Limpieza"
      subtitle="Inspecciones por área de planta"
    >
      <template #actions>
        <button
          @click="ol.reload()"
          class="btn-ghost"
          :disabled="ol.list.loading"
          title="Recargar"
        >
          <IconRefresh
            class="w-4 h-4"
            :class="{ 'animate-spin': ol.list.loading }"
          />
        </button>
        <router-link to="/limpieza/new" class="btn-primary">
          <IconPlus class="w-4 h-4" />
          Nueva inspección
        </router-link>
      </template>
    </PageHeader>

    <div class="px-4 sm:px-6 lg:px-10 py-6">
      <FilterBar
        :filters="filters"
        search-placeholder="Buscar por folio o usuario…"
        :count-label="`${rows.length} ${rows.length === 1 ? 'inspección' : 'inspecciones'}`"
      />

      <LoadingCard v-if="ol.list.loading && !ol.data" />

      <ErrorCard
        v-else-if="ol.list.error"
        :message="ol.list.error?.messages?.[0] || ol.list.error?.message"
        @retry="ol.reload()"
      />

      <EmptyState
        v-else-if="!rows.length"
        :filtered="filters.hasFilters.value"
        new-route="/limpieza/new"
      >
        <template #icon><IconSparkles class="w-6 h-6" /></template>
        <template #empty-title>Aún no hay inspecciones</template>
        <template #empty-hint>
          Crea la primera inspección de orden y limpieza.
        </template>
        <template #cta>Nueva inspección</template>
      </EmptyState>

      <div v-else>
        <div class="card overflow-hidden hidden md:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="thead-row">
                <th class="th">Folio</th>
                <th class="th">Fecha</th>
                <th class="th">Hora</th>
                <th class="th">Usuario</th>
                <th class="th">Cumplimiento</th>
                <th class="th">Estado</th>
                <th class="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.name"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition cursor-pointer group"
                @click="$router.push(`/limpieza/${encodeURIComponent(row.name)}`)"
              >
                <td class="px-4 py-2.5 font-mono text-xs text-gray-700">
                  {{ row.name }}
                </td>
                <td class="px-4 py-2.5 text-gray-700">
                  {{ formatDate(row.fecha_inspeccion) }}
                </td>
                <td class="px-4 py-2.5 text-gray-600">
                  {{ formatTime(row.hora_inspeccion) }}
                </td>
                <td class="px-4 py-2.5 text-gray-700">
                  {{ row.full_user_name || '—' }}
                </td>
                <td class="px-4 py-2.5">
                  <span
                    class="font-semibold tabular-nums"
                    :class="scoreColor(row.total)"
                  >
                    {{ formatScore(row.total) }}%
                  </span>
                </td>
                <td class="px-4 py-2.5">
                  <StatusBadge :docstatus="row.docstatus" />
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
            v-for="row in rows"
            :key="row.name"
            class="card p-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50/70 transition"
            @click="$router.push(`/limpieza/${encodeURIComponent(row.name)}`)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-mono text-xs text-gray-700 truncate">
                  {{ row.name }}
                </span>
                <StatusBadge :docstatus="row.docstatus" class="shrink-0" />
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="text-sm text-gray-900 truncate">
                  {{ row.full_user_name || '—' }}
                </div>
                <span
                  class="text-sm font-semibold tabular-nums shrink-0"
                  :class="scoreColor(row.total)"
                >
                  {{ formatScore(row.total) }}%
                </span>
              </div>
              <div class="text-xs text-gray-500 mt-0.5">
                {{ formatDate(row.fecha_inspeccion) }} ·
                {{ formatTime(row.hora_inspeccion) }}
              </div>
            </div>
            <IconChevronRight class="w-4 h-4 text-gray-300 mt-1 shrink-0" />
          </li>
        </ul>
        <Pagination
          :count="rows.length"
          :has-more="!!ol.hasNextPage"
          :loading="ol.list.loading"
          :page-size="filters.pageSize.value"
          @update:page-size="filters.setPageSize"
          @load-more="ol.next()"
          item-singular="inspección"
          item-plural="inspecciones"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useOLList } from '@/data/limpieza'
import { useListFilters } from '@/composables/listFilters'
import { formatDate, formatTime } from '@/utils/format'
import { scoreColor } from '@/utils/docstatus'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import FilterBar from '@/components/FilterBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingCard from '@/components/LoadingCard.vue'
import ErrorCard from '@/components/ErrorCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconPlus from '~icons/lucide/plus'
import IconRefresh from '~icons/lucide/refresh-cw'
import IconSparkles from '~icons/lucide/sparkles'
import IconChevronRight from '~icons/lucide/chevron-right'

const ol = useOLList()
const filters = useListFilters(ol, {
  dateField: 'fecha_inspeccion',
  searchFields: ['name', 'full_user_name'],
})
const rows = filters.rows

function formatScore(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.0'
  return n.toFixed(1)
}
</script>
