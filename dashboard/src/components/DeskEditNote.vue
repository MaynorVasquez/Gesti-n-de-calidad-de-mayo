<template>
  <p class="text-xs text-gray-500">
    Para editar este documento, abrí
    <a :href="href" target="_blank" rel="noopener" class="text-blue-600 hover:underline">
      en Desk</a
    >.
  </p>
</template>

<script setup>
defineProps({
  href: { type: String, required: true },
})
</script>
