<template>
  <div class="flex flex-col h-full min-h-0">
    <div
      class="flex items-center border-b border-gray-100 px-3 py-3 gap-2"
      :class="collapsed ? 'justify-center' : 'justify-between'"
    >
      <div class="flex items-center gap-2.5 min-w-0" v-if="!collapsed">
        <div
          class="w-9 h-9 rounded-md bg-gray-900 text-white flex items-center justify-center text-xs font-bold tracking-wider shrink-0"
        >
          QC
        </div>
        <div class="leading-tight min-w-0">
          <div class="text-sm font-semibold text-gray-900 truncate">
            Calidad
          </div>
          <div
            class="text-[11px] text-gray-500 uppercase tracking-wider truncate"
          >
            Dashboard
          </div>
        </div>
      </div>
      <button
        v-if="showCollapseToggle"
        @click="$emit('toggle-collapse')"
        class="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100 transition shrink-0"
        :title="collapsed ? 'Expandir menú' : 'Colapsar menú'"
      >
        <IconPanelOpen v-if="collapsed" class="w-4 h-4" />
        <IconPanelClose v-else class="w-4 h-4" />
      </button>
      <button
        v-if="showClose"
        @click="$emit('close')"
        class="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100 transition shrink-0"
        title="Cerrar menú"
      >
        <IconX class="w-4 h-4" />
      </button>
    </div>

    <nav class="flex-1 px-3 py-2 space-y-0.5 text-sm overflow-y-auto">
      <div
        v-if="!collapsed"
        class="px-2 pt-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider"
      >
        Módulos
      </div>
      <a
        v-for="item in nav"
        :key="item.to"
        href="#"
        @click.prevent="$emit('goto', item.to)"
        :class="itemCls(item)"
        :title="collapsed ? item.label : ''"
      >
        <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
      </a>
    </nav>

    <div class="border-t border-gray-100 p-3 space-y-2">
      <div
        class="flex items-center gap-2.5"
        :class="collapsed ? 'justify-center' : ''"
        :title="collapsed ? user : ''"
      >
        <div
          class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold shrink-0"
        >
          {{ initials }}
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <div class="text-xs font-medium text-gray-900 truncate">
            {{ user || 'Usuario' }}
          </div>
          <div class="text-[11px] text-gray-500 truncate">Sesión activa</div>
        </div>
      </div>

      <div :class="['flex gap-1', collapsed ? 'flex-col' : '']">
        <a
          href="/app"
          target="_blank"
          rel="noopener"
          class="btn-ghost flex-1 justify-center"
          :class="collapsed ? '!px-2' : ''"
          title="Abrir Desk"
        >
          <IconExternalLink class="w-4 h-4" />
          <span v-if="!collapsed">Desk</span>
        </a>
        <button
          @click="$emit('logout')"
          :disabled="loggingOut"
          class="btn-ghost flex-1 justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
          :class="collapsed ? '!px-2' : ''"
          title="Cerrar sesión"
        >
          <IconLoader v-if="loggingOut" class="w-4 h-4 animate-spin" />
          <IconLogOut v-else class="w-4 h-4" />
          <span v-if="!collapsed">Salir</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import IconExternalLink from '~icons/lucide/external-link'
import IconPanelOpen from '~icons/lucide/panel-left-open'
import IconPanelClose from '~icons/lucide/panel-left-close'
import IconLogOut from '~icons/lucide/log-out'
import IconLoader from '~icons/lucide/loader-circle'
import IconX from '~icons/lucide/x'

defineProps({
  collapsed: { type: Boolean, default: false },
  nav: { type: Array, required: true },
  user: { type: String, default: '' },
  initials: { type: String, default: '' },
  loggingOut: { type: Boolean, default: false },
  isActive: { type: Function, required: true },
  itemCls: { type: Function, required: true },
  showCollapseToggle: { type: Boolean, default: false },
  showClose: { type: Boolean, default: false },
})

defineEmits(['goto', 'logout', 'toggle-collapse', 'close'])
</script>
