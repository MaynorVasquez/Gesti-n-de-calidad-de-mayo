<template>
  <!-- Sidebar de escritorio -->
  <aside
    :class="[
      'hidden md:flex flex-col shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0 transition-[width] duration-200 ease-out',
      collapsed ? 'w-[64px]' : 'w-60',
    ]"
  >
    <SidebarContent
      :collapsed="collapsed"
      :nav="nav"
      :user="user"
      :initials="initials"
      :logging-out="loggingOut"
      :is-active="isActive"
      :item-cls="itemCls"
      @goto="goto"
      @logout="logout"
      @toggle-collapse="toggle"
      show-collapse-toggle
    />
  </aside>

  <!-- Drawer móvil -->
  <Teleport to="body">
    <div
      v-if="mobileOpen"
      class="md:hidden fixed inset-0 z-40 bg-black/40"
      @click="close"
    />
    <aside
      :class="[
        'md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <SidebarContent
        :collapsed="false"
        :nav="nav"
        :user="user"
        :initials="initials"
        :logging-out="loggingOut"
        :is-active="isActive"
        :item-cls="(i) => itemCls(i, false)"
        @goto="(to) => { goto(to); close() }"
        @logout="logout"
        show-close
        @close="close"
      />
    </aside>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from '@/composables/confirm'
import { useSidebar } from '@/composables/sidebar'
import SidebarContent from '@/components/SidebarContent.vue'
import IconHome from '~icons/lucide/home'
import IconDroplets from '~icons/lucide/droplets'
import IconUsers from '~icons/lucide/users'
import IconSparkles from '~icons/lucide/sparkles'

const STORAGE_KEY = 'qc-sidebar-collapsed'
const collapsed = ref(localStorage.getItem(STORAGE_KEY) === '1')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem(STORAGE_KEY, collapsed.value ? '1' : '0')
}

const { mobileOpen, close } = useSidebar()
const route = useRoute()
const router = useRouter()

watch(() => route.fullPath, () => close())

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

function itemCls(item, useCollapsed = collapsed.value) {
  return [
    'flex items-center gap-2.5 rounded-md transition cursor-pointer no-underline',
    useCollapsed ? 'justify-center px-2 py-2' : 'px-2.5 py-2',
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
