<template>
  <div
    class="flex items-center justify-between mt-4 text-xs text-gray-600 flex-wrap gap-3"
  >
    <div>
      Mostrando
      <span class="font-medium text-gray-900">{{ count }}</span>
      {{ count === 1 ? itemSingular : itemPlural }}
      <span v-if="hasMore" class="text-gray-400">· hay más para cargar</span>
    </div>
    <div class="flex items-center gap-2">
      <label class="text-gray-500">Mostrar</label>
      <select
        :value="pageSize"
        @change="$emit('update:pageSize', Number($event.target.value))"
        class="select !w-auto !pr-8"
      >
        <option v-for="opt in pageSizes" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
      <button
        v-if="hasMore"
        type="button"
        @click="$emit('loadMore')"
        :disabled="loading"
        class="btn-secondary"
      >
        <IconLoader v-if="loading" class="w-3.5 h-3.5 animate-spin" />
        <IconChevronDown v-else class="w-3.5 h-3.5" />
        Cargar más
      </button>
    </div>
  </div>
</template>

<script setup>
import IconLoader from '~icons/lucide/loader-circle'
import IconChevronDown from '~icons/lucide/chevron-down'

defineProps({
  count: { type: Number, default: 0 },
  hasMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  pageSize: { type: Number, default: 20 },
  pageSizes: { type: Array, default: () => [20, 50, 100] },
  itemSingular: { type: String, default: 'registro' },
  itemPlural: { type: String, default: 'registros' },
})

defineEmits(['update:pageSize', 'loadMore'])
</script>
