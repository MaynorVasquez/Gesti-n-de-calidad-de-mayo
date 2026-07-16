<template>
  <div class="card p-12 text-center">
    <div
      class="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3"
    >
      <slot name="icon">
        <IconInbox class="w-6 h-6" />
      </slot>
    </div>
    <div class="text-sm font-medium text-gray-700 mb-1">
      <slot v-if="filtered" name="filtered-title">Sin resultados</slot>
      <slot v-else name="empty-title">Aún no hay registros</slot>
    </div>
    <div class="text-xs text-gray-500 mb-4">
      <slot v-if="filtered" name="filtered-hint">
        Probá con otros filtros o términos de búsqueda.
      </slot>
      <slot v-else name="empty-hint" />
    </div>
    <router-link v-if="!filtered && newRoute" :to="newRoute" class="btn-primary">
      <IconPlus class="w-4 h-4" />
      <slot name="cta">Nuevo registro</slot>
    </router-link>
  </div>
</template>

<script setup>
import IconInbox from '~icons/lucide/inbox'
import IconPlus from '~icons/lucide/plus'

defineProps({
  // true = hay filtros/búsqueda activos (el vacío es "sin resultados");
  // false = la lista está realmente vacía (nunca se registró nada)
  filtered: { type: Boolean, default: false },
  newRoute: { type: String, default: '' },
})
</script>
