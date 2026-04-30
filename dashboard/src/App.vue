<template>
  <div class="flex min-h-screen bg-gray-50">
    <Sidebar />
    <div class="flex-1 min-w-0 flex flex-col">
      <router-view />
    </div>
    <ConfirmDialog />
  </div>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
</script>
