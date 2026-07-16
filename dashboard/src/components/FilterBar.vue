<template>
  <div class="flex items-end gap-2 mb-4 flex-wrap">
    <div class="relative flex-1 min-w-[180px] sm:min-w-[220px] max-w-sm">
      <IconSearch
        class="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        :value="filters.search.value"
        @input="filters.search.value = $event.target.value"
        type="text"
        :placeholder="searchPlaceholder"
        class="input pl-8"
      />
    </div>

    <div>
      <label class="field-label">Desde</label>
      <input
        :value="filters.dateFrom.value"
        @input="filters.dateFrom.value = $event.target.value"
        type="date"
        class="input w-40"
      />
    </div>
    <div>
      <label class="field-label">Hasta</label>
      <input
        :value="filters.dateTo.value"
        @input="filters.dateTo.value = $event.target.value"
        type="date"
        class="input w-40"
      />
    </div>
    <div>
      <label class="field-label">Estado</label>
      <select
        :value="filters.statusFilter.value"
        @change="filters.statusFilter.value = $event.target.value"
        class="select w-36"
      >
        <option value="">Todos</option>
        <option value="0">Borrador</option>
        <option value="1">Enviado</option>
        <option value="2">Cancelado</option>
      </select>
    </div>

    <!-- Filtros adicionales propios del módulo -->
    <slot />

    <button
      v-if="filters.hasFilters.value"
      @click="filters.clearFilters()"
      class="btn-ghost"
      title="Limpiar filtros"
    >
      <IconX class="w-4 h-4" />
      Limpiar
    </button>

    <div class="flex-1" />
    <div class="text-xs text-gray-500 pb-2">
      {{ countLabel }}
    </div>
  </div>
</template>

<script setup>
import IconSearch from '~icons/lucide/search'
import IconX from '~icons/lucide/x'

defineProps({
  // Objeto devuelto por useListFilters (refs incluidos)
  filters: { type: Object, required: true },
  searchPlaceholder: { type: String, default: 'Buscar…' },
  // Texto ya pluralizado, p.ej. "12 inspecciones"
  countLabel: { type: String, default: '' },
})
</script>
