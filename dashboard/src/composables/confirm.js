import { reactive } from 'vue'

export const confirmState = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'primary',
  resolver: null,
})

export function useConfirm() {
  return function confirm(opts = {}) {
    return new Promise((resolve) => {
      Object.assign(confirmState, {
        visible: true,
        title: opts.title || '¿Confirmar acción?',
        message: opts.message || '',
        confirmText: opts.confirmText || 'Confirmar',
        cancelText: opts.cancelText || 'Cancelar',
        variant: opts.variant || 'primary',
        resolver: resolve,
      })
    })
  }
}

export function answerConfirm(value) {
  if (confirmState.resolver) {
    confirmState.resolver(value)
    confirmState.resolver = null
  }
  confirmState.visible = false
}
