<template>
  <div class="card p-12 text-center">
    <div
      class="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3"
    >
      <IconAlert class="w-6 h-6" />
    </div>
    <div class="text-sm font-medium text-gray-700 mb-1">
      No se pudieron cargar los datos
    </div>
    <div class="text-xs text-gray-500 mb-4">
      {{ message || 'Revisa tu conexión e intenta de nuevo.' }}
    </div>
    <button type="button" class="btn-secondary" @click="$emit('retry')">
      <IconRefresh class="w-4 h-4" />
      Reintentar
    </button>
  </div>
</template>

<script setup>
import IconAlert from '~icons/lucide/alert-circle'
import IconRefresh from '~icons/lucide/refresh-cw'

defineProps({
  message: { type: String, default: '' },
})

defineEmits(['retry'])
</script>
