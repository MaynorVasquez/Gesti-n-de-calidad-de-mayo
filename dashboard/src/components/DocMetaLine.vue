<template>
  <div class="flex items-center gap-3 flex-wrap">
    <StatusBadge :docstatus="doc.docstatus" />
    <slot />
    <span class="text-xs text-gray-500">
      Modificado {{ formatDateTime(doc.modified) }}
    </span>
    <span class="text-xs text-gray-400">·</span>
    <span class="text-xs text-gray-500">por {{ doc.modified_by }}</span>
  </div>
</template>

<script setup>
import StatusBadge from './StatusBadge.vue'
import { formatDateTime } from '@/utils/format'

defineProps({
  doc: { type: Object, required: true },
})
</script>
