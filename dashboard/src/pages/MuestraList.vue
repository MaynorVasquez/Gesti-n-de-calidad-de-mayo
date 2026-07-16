<template>
  <div>
    <PageHeader
      title="Muestras de Producto"
      subtitle="Registro de muestras de control de calidad por lote"
    >
      <template #actions>
        <button
          @click="muestras.reload()"
          class="btn-ghost"
          :disabled="muestras.list.loading"
          title="Recargar"
        >
          <IconRefresh
            class="w-4 h-4"
            :class="{ 'animate-spin': muestras.list.loading }"
          />
        </button>
        <router-link to="/muestras/new" class="btn-primary">
          <IconPlus class="w-4 h-4" />
          Nueva muestra
        </router-link>
      </template>
    </PageHeader>

    <div class="px-4 sm:px-6 lg:px-10 py-6">
      <FilterBar
        :filters="filters"
        search-placeholder="Buscar por folio, producto o lote…"
        :count-label="`${rows.length} ${rows.length === 1 ? 'muestra' : 'muestras'}`"
      />

      <LoadingCard v-if="muestras.list.loading && !muestras.data" />

      <ErrorCard
        v-else-if="muestras.list.error"
        :message="muestras.list.error?.messages?.[0] || muestras.list.error?.message"
        @retry="muestras.reload()"
      />

      <EmptyState
        v-else-if="!rows.length"
        :filtered="filters.hasFilters.value"
        new-route="/muestras/new"
      >
        <template #icon><IconFlask class="w-6 h-6" /></template>
        <template #empty-title>Aún no hay muestras</template>
        <template #empty-hint>
          Registra la primera muestra de un control de calidad abierto.
        </template>
        <template #cta>Nueva muestra</template>
      </EmptyState>

      <div v-else>
        <div class="card overflow-hidden hidden md:block">
          <table class="w-full text-sm">
            <thead>
              <tr class="thead-row">
                <th class="th">Folio</th>
                <th class="th">Producto</th>
                <th class="th">Lote</th>
                <th class="th">Fecha</th>
                <th class="th">Hora</th>
                <th class="th">Estado</th>
                <th class="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.name"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition cursor-pointer group"
                @click="$router.push(`/muestras/${encodeURIComponent(row.name)}`)"
              >
                <td class="px-4 py-2.5 font-mono text-xs text-gray-700">
                  {{ row.name }}
                </td>
                <td class="px-4 py-2.5 text-gray-700">
                  {{ row.itemname || '—' }}
                </td>
                <td class="px-4 py-2.5 text-gray-600 font-mono text-xs">
                  {{ row.batchnum || '—' }}
                </td>
                <td class="px-4 py-2.5 text-gray-700">
                  {{ formatDate(row.docdate) }}
                </td>
                <td class="px-4 py-2.5 text-gray-600">
                  {{ formatTime(row.hora_muestra) }}
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
            @click="$router.push(`/muestras/${encodeURIComponent(row.name)}`)"
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
                Lote {{ row.batchnum || '—' }} ·
                {{ formatDate(row.docdate) }} ·
                {{ formatTime(row.hora_muestra) }}
              </div>
            </div>
            <IconChevronRight class="w-4 h-4 text-gray-300 mt-1 shrink-0" />
          </li>
        </ul>
        <Pagination
          :count="rows.length"
          :has-more="!!muestras.hasNextPage"
          :loading="muestras.list.loading"
          :page-size="filters.pageSize.value"
          @update:page-size="filters.setPageSize"
          @load-more="muestras.next()"
          item-singular="muestra"
          item-plural="muestras"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMuestraList } from '@/data/muestras'
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
import IconFlask from '~icons/lucide/flask-conical'
import IconChevronRight from '~icons/lucide/chevron-right'

const muestras = useMuestraList()
const filters = useListFilters(muestras, {
  dateField: 'docdate',
  searchFields: ['name', 'itemname', 'batchnum'],
})
const rows = filters.rows
</script>
