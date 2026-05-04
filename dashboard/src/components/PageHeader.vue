<template>
  <div class="border-b border-gray-200 bg-white">
    <div class="px-4 sm:px-6 lg:px-10 py-4 flex items-center gap-3 flex-wrap">
      <button
        @click="sidebar.open()"
        class="md:hidden text-gray-500 hover:text-gray-900 -ml-1 p-1 rounded hover:bg-gray-100 transition"
        title="Abrir menú"
      >
        <IconMenu class="w-5 h-5" />
      </button>
      <button
        v-if="back"
        @click="$router.push(back)"
        class="text-gray-500 hover:text-gray-900 -ml-1 p-1 rounded hover:bg-gray-100 transition"
        title="Volver"
      >
        <IconArrowLeft class="w-5 h-5" />
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="text-base font-semibold text-gray-900 truncate">
          {{ title }}
        </h1>
        <p v-if="subtitle" class="text-xs text-gray-500 mt-0.5 truncate">
          {{ subtitle }}
        </p>
      </div>
      <div
        class="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto order-last md:order-none"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconMenu from '~icons/lucide/menu'
import { useSidebar } from '@/composables/sidebar'

const sidebar = useSidebar()

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  back: { type: [String, Object], default: null },
})
</script>
