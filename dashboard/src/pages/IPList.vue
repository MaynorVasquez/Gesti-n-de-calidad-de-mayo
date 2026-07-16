<template>
  <div>
    <PageHeader
      title="Inspección de Personal"
      subtitle="Control BPM al personal de planta"
    >
      <template #actions>
        <button
          @click="ip.reload()"
          class="btn-ghost"
          :disabled="ip.list.loading"
          title="Recargar"
        >
          <IconRefresh
            class="w-4 h-4"
            :class="{ 'animate-spin': ip.list.loading }"
          />
        </button>
        <router-link to="/personal/new" class="btn-primary">
          <IconPlus class="w-4 h-4" />
          Nueva inspección
        </router-link>
      </template>
    </PageHeader>

    <div class="px-4 sm:px-6 lg:px-10 py-6">
      <FilterBar
        :filters="filters"
        search-placeholder="Buscar por folio o supervisor…"
        :count-label="`${rows.length} ${rows.length === 1 ? 'inspección' : 'inspecciones'}`"
      />

      <LoadingCard v-if="ip.list.loading && !ip.data" />

      <ErrorCard
        v-else-if="ip.list.error"
        :message="ip.list.error?.messages?.[0] || ip.list.error?.message"
        @retry="ip.reload()"
      />

      <EmptyState
        v-else-if="!rows.length"
        :filtered="filters.hasFilters.value"
        new-route="/personal/new"
      >
        <template #icon><IconUsers class="w-6 h-6" /></template>
        <template #empty-title>Aún no hay inspecciones</template>
        <template #empty-hint>
          Crea la primera inspección BPM para empezar a registrar al personal.
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
                <th class="th">Supervisor</th>
                <th class="th">Estado</th>
                <th class="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.name"
                class="border-t border-gray-100 hover:bg-gray-50/70 transition cursor-pointer group"
                @click="$router.push(`/personal/${encodeURIComponent(row.name)}`)"
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
                  {{ row.supervisor || '—' }}
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
            @click="$router.push(`/personal/${encodeURIComponent(row.name)}`)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-mono text-xs text-gray-700 truncate">
                  {{ row.name }}
                </span>
                <StatusBadge :docstatus="row.docstatus" class="shrink-0" />
              </div>
              <div class="text-sm text-gray-900 truncate">
                {{ row.supervisor || '—' }}
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
          :has-more="!!ip.hasNextPage"
          :loading="ip.list.loading"
          :page-size="filters.pageSize.value"
          @update:page-size="filters.setPageSize"
          @load-more="ip.next()"
          item-singular="inspección"
          item-plural="inspecciones"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useIPList } from '@/data/personal'
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
import IconUsers from '~icons/lucide/users'
import IconChevronRight from '~icons/lucide/chevron-right'

const ip = useIPList()
const filters = useListFilters(ip, {
  dateField: 'fecha_inspeccion',
  searchFields: ['name', 'supervisor'],
})
const rows = filters.rows
</script>
