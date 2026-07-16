<template>
  <div
    v-if="message"
    class="card p-3 border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-2"
  >
    <IconAlert class="w-4 h-4 mt-0.5 shrink-0" />
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
import IconAlert from '~icons/lucide/alert-circle'

defineProps({
  message: { type: String, default: '' },
})
</script>
