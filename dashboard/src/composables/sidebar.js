import { ref } from 'vue'

const mobileOpen = ref(false)

export function useSidebar() {
  return {
    mobileOpen,
    open: () => (mobileOpen.value = true),
    close: () => (mobileOpen.value = false),
    toggle: () => (mobileOpen.value = !mobileOpen.value),
  }
}
