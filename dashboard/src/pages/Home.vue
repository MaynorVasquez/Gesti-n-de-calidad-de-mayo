<template>
  <div>
    <PageHeader title="Inicio" subtitle="Resumen de los módulos disponibles" />

    <div class="px-4 sm:px-6 lg:px-10 py-8 max-w-6xl">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          to="/atp"
          class="group block p-5 card hover:border-gray-300 hover:shadow-sm transition"
        >
          <div class="flex items-start justify-between mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"
            >
              <IconDroplets class="w-5 h-5" />
            </div>
            <IconArrowRight
              class="w-4 h-4 text-gray-300 group-hover:text-gray-700 group-hover:translate-x-0.5 transition"
            />
          </div>
          <div class="font-medium text-gray-900">Lavado de Manos ATP</div>
          <div class="text-xs text-gray-500 mt-1 leading-relaxed">
            Inspecciones de higiene del personal y resultados ATP por área
          </div>
        </router-link>

        <router-link
          to="/personal"
          class="group block p-5 card hover:border-gray-300 hover:shadow-sm transition"
        >
          <div class="flex items-start justify-between mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"
            >
              <IconUsers class="w-5 h-5" />
            </div>
            <IconArrowRight
              class="w-4 h-4 text-gray-300 group-hover:text-gray-700 group-hover:translate-x-0.5 transition"
            />
          </div>
          <div class="font-medium text-gray-900">Inspección de Personal</div>
          <div class="text-xs text-gray-500 mt-1 leading-relaxed">
            Control BPM: uniforme, redecilla, mascarilla, manos, joyería y más
          </div>
        </router-link>

        <router-link
          to="/limpieza"
          class="group block p-5 card hover:border-gray-300 hover:shadow-sm transition"
        >
          <div class="flex items-start justify-between mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"
            >
              <IconBroom class="w-5 h-5" />
            </div>
            <IconArrowRight
              class="w-4 h-4 text-gray-300 group-hover:text-gray-700 group-hover:translate-x-0.5 transition"
            />
          </div>
          <div class="font-medium text-gray-900">Orden y Limpieza</div>
          <div class="text-xs text-gray-500 mt-1 leading-relaxed">
            Inspecciones por área con 6 criterios y cálculo de cumplimiento
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/PageHeader.vue'
import IconDroplets from '~icons/lucide/droplets'
import IconArrowRight from '~icons/lucide/arrow-right'
import IconUsers from '~icons/lucide/users'
import IconBroom from '~icons/lucide/sparkles'
</script>
