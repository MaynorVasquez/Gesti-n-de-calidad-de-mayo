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
      <FilterBar
        :filters="filters"
        search-placeholder="Buscar por folio, producto o control…"
        :count-label="`${rows.length} ${rows.length === 1 ? 'paro' : 'paros'}`"
      >
        <div>
          <label class="field-label">Status</label>
          <select v-model="paroStatusFilter" class="select w-48">
            <option value="">Todos</option>
            <option v-for="s in PARO_STATUSES" :key="s" :value="s">
              {{ paroStatusLabel(s) }}
            </option>
          </select>
        </div>
      </FilterBar>

      <LoadingCard v-if="paros.list.loading && !paros.data" />

      <ErrorCard
        v-else-if="paros.list.error"
        :message="paros.list.error?.messages?.[0] || paros.list.error?.message"
        @retry="paros.reload()"
      />

      <EmptyState
        v-else-if="!rows.length"
        :filtered="filters.hasFilters.value"
        new-route="/paros/new"
      >
        <template #icon><IconPause class="w-6 h-6" /></template>
        <template #empty-title>Aún no hay paros registrados</template>
        <template #empty-hint>
          Registra un paro de producción sobre un control de calidad abierto.
        </template>
        <template #cta>Nuevo paro</template>
      </EmptyState>

      <div v-else>
        <div class="card overflow-hidden hidden md:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="thead-row">
                <th class="th">Folio</th>
                <th class="th">Producto</th>
                <th class="th">Control</th>
                <th class="th">Fecha</th>
                <th class="th">Hora</th>
                <th class="th">Status</th>
                <th class="th">Estado</th>
                <th class="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
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
            @click="$router.push(`/paros/${encodeURIComponent(row.name)}`)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-mono text-xs text-gray-700 truncate">
                  {{ row.name }}
                </span>
                <StatusBadge :docstatus="row.docstatus" class="shrink-0" />
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
          :count="rows.length"
          :has-more="!!paros.hasNextPage"
          :loading="paros.list.loading"
          :page-size="filters.pageSize.value"
          @update:page-size="filters.setPageSize"
          @load-more="paros.next()"
          item-singular="paro"
          item-plural="paros"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  useParoList,
  PARO_STATUSES,
  paroStatusClass,
  paroStatusLabel,
} from '@/data/paros'
import { useListFilters } from '@/composables/listFilters'
import { formatDate, formatTime } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import Pagination from '@/components/Pagination.vue'
import FilterBar from '@/components/FilterBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingCard from '@/components/LoadingCard.vue'
import ErrorCard from '@/components/ErrorCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import IconPlus from '~icons/lucide/plus'
import IconRefresh from '~icons/lucide/refresh-cw'
import IconPause from '~icons/lucide/circle-pause'
import IconChevronRight from '~icons/lucide/chevron-right'

const paros = useParoList()
const paroStatusFilter = ref('')

const filters = useListFilters(paros, {
  dateField: 'docdate',
  searchFields: ['name', 'itemname', 'qc_producto'],
  extraRefs: [paroStatusFilter],
  extraFilters: () =>
    paroStatusFilter.value !== ''
      ? [['status', '=', paroStatusFilter.value]]
      : [],
})
const rows = filters.rows
</script>
