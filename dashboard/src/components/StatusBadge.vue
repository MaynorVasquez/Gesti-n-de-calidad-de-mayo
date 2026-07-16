<template>
  <span class="badge" :class="docstatusClass(docstatus)">
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass(docstatus)" />
    {{ docstatusLabel(docstatus) }}
  </span>
</template>

<script setup>
import { docstatusClass, docstatusLabel, dotClass } from '@/utils/docstatus'

defineProps({
  docstatus: { type: Number, default: 0 },
})
</script>
