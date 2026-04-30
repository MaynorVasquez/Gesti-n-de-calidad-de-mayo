<template>
  <aside
    :class="[
      'hidden md:flex flex-col shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 transition-[width] duration-200 ease-out',
      collapsed ? 'w-[64px]' : 'w-60',
    ]"
  >
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
        @click="toggle"
        class="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100 transition shrink-0"
        :title="collapsed ? 'Expandir menú' : 'Colapsar menú'"
      >
        <IconPanelOpen v-if="collapsed" class="w-4 h-4" />
        <IconPanelClose v-else class="w-4 h-4" />
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
        @click.prevent="goto(item.to)"
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
          @click="logout"
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
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from '@/composables/confirm'
import IconHome from '~icons/lucide/home'
import IconDroplets from '~icons/lucide/droplets'
import IconUsers from '~icons/lucide/users'
import IconSparkles from '~icons/lucide/sparkles'
import IconExternalLink from '~icons/lucide/external-link'
import IconPanelOpen from '~icons/lucide/panel-left-open'
import IconPanelClose from '~icons/lucide/panel-left-close'
import IconLogOut from '~icons/lucide/log-out'
import IconLoader from '~icons/lucide/loader-circle'

const STORAGE_KEY = 'qc-sidebar-collapsed'
const collapsed = ref(localStorage.getItem(STORAGE_KEY) === '1')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0')
}

const route = useRoute()
const router = useRouter()

const nav = [
  { to: '/', label: 'Inicio', icon: IconHome, exact: true },
  { to: '/atp', label: 'Lavado de Manos ATP', icon: IconDroplets },
  { to: '/personal', label: 'Inspección de Personal', icon: IconUsers },
  { to: '/limpieza', label: 'Orden y Limpieza', icon: IconSparkles },
]

const user = computed(
  () =>
    decodeURIComponent(getCookie('full_name') || '').replace(/\+/g, ' ') ||
    'Usuario'
)

const initials = computed(() => {
  const s = user.value || 'U'
  return (
    s
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'U'
  )
})

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find((r) => r.startsWith(name + '='))
    ?.split('=')[1]
}

function isActive(item) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

function itemCls(item) {
  return [
    'flex items-center gap-2.5 rounded-md transition cursor-pointer no-underline',
    collapsed.value ? 'justify-center px-2 py-2' : 'px-2.5 py-2',
    isActive(item)
      ? 'bg-gray-100 text-gray-900 font-medium'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
  ]
}

function goto(to) {
  router.push(to)
}

const loggingOut = ref(false)
const confirm = useConfirm()

async function logout() {
  const ok = await confirm({
    title: '¿Cerrar sesión?',
    message: 'Vas a salir del dashboard. Podrás volver a iniciar sesión cuando quieras.',
    confirmText: 'Cerrar sesión',
    cancelText: 'Quedarme',
    variant: 'primary',
  })
  if (!ok) return
  loggingOut.value = true
  try {
    await fetch('/api/method/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || '',
      },
    })
  } catch (e) {
    /* aún si falla la llamada, intentamos redirigir */
  }
  window.location.href = '/login'
}
</script>
