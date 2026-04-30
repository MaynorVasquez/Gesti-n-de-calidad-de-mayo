<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="state.visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px]"
          @click="cancel"
        />

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="state.visible"
            class="relative card max-w-md w-full p-6 shadow-xl"
          >
            <div class="flex items-start gap-3">
              <div :class="iconWrap">
                <component :is="iconComp" class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0 pt-0.5">
                <h3 class="text-base font-semibold text-gray-900">
                  {{ state.title }}
                </h3>
                <p
                  v-if="state.message"
                  class="text-sm text-gray-600 mt-1 leading-relaxed"
                >
                  {{ state.message }}
                </p>
              </div>
              <button
                type="button"
                @click="cancel"
                class="text-gray-400 hover:text-gray-700 -mr-1 -mt-1 p-1 rounded hover:bg-gray-100 transition shrink-0"
                title="Cerrar"
              >
                <IconX class="w-4 h-4" />
              </button>
            </div>

            <div class="flex justify-end gap-2 mt-6">
              <button
                type="button"
                @click="cancel"
                class="btn-secondary"
              >
                {{ state.cancelText }}
              </button>
              <button
                ref="okBtn"
                type="button"
                @click="ok"
                class="btn-primary"
                :class="{
                  '!bg-red-600 hover:!bg-red-700 !ring-red-600':
                    state.variant === 'danger',
                }"
              >
                {{ state.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { confirmState, answerConfirm } from '@/composables/confirm'
import IconX from '~icons/lucide/x'
import IconAlert from '~icons/lucide/alert-triangle'
import IconHelp from '~icons/lucide/help-circle'

const state = confirmState
const okBtn = ref(null)

const iconComp = computed(() =>
  state.variant === 'danger' ? IconAlert : IconHelp
)

const iconWrap = computed(() => [
  'shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
  state.variant === 'danger'
    ? 'bg-red-100 text-red-600'
    : 'bg-blue-100 text-blue-600',
])

watch(
  () => state.visible,
  async (v) => {
    if (v) {
      await nextTick()
      okBtn.value?.focus()
      document.addEventListener('keydown', onKey)
    } else {
      document.removeEventListener('keydown', onKey)
    }
  }
)

function onKey(e) {
  if (e.key === 'Escape') cancel()
  else if (e.key === 'Enter') ok()
}

function ok() {
  answerConfirm(true)
}
function cancel() {
  answerConfirm(false)
}
</script>
