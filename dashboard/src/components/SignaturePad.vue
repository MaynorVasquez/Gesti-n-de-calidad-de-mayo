<template>
  <div class="border border-gray-200 rounded-md bg-white overflow-hidden">
    <div
      class="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50"
    >
      <div class="text-xs text-gray-500">{{ label }}</div>
      <button
        v-if="!readonly"
        type="button"
        @click="clear"
        :disabled="!hasSignature"
        class="text-xs text-gray-500 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-500 inline-flex items-center gap-1"
      >
        <IconEraser class="w-3.5 h-3.5" />
        Limpiar
      </button>
    </div>
    <div
      ref="wrapperRef"
      class="relative bg-white"
      :style="{ height: height + 'px', touchAction: 'none' }"
    >
      <canvas
        ref="canvasRef"
        class="block w-full h-full"
        :class="{ 'cursor-crosshair': !readonly }"
      />
      <div
        v-if="!hasSignature"
        class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none select-none"
      >
        {{ readonly ? 'Sin firma' : 'Firmá aquí con el dedo o el ratón' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import SignaturePad from 'signature_pad'
import IconEraser from '~icons/lucide/eraser'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Firma' },
  height: { type: Number, default: 160 },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const canvasRef = ref(null)
const wrapperRef = ref(null)
const hasSignature = ref(!!props.modelValue)
let pad = null
let resizeObserver = null

function resizeCanvas() {
  if (!canvasRef.value || !pad) return
  const canvas = canvasRef.value
  const ratio = Math.max(window.devicePixelRatio || 1, 1)
  const wasEmpty = pad.isEmpty()
  const oldData = wasEmpty ? '' : pad.toDataURL('image/png')
  canvas.width = canvas.offsetWidth * ratio
  canvas.height = canvas.offsetHeight * ratio
  canvas.getContext('2d').scale(ratio, ratio)
  pad.clear()
  if (oldData) pad.fromDataURL(oldData)
  else if (props.modelValue) pad.fromDataURL(props.modelValue)
  hasSignature.value = !pad.isEmpty()
}

function onEndStroke() {
  hasSignature.value = !pad.isEmpty()
  emit(
    'update:modelValue',
    pad.isEmpty() ? '' : pad.toDataURL('image/png')
  )
}

function clear() {
  pad?.clear()
  hasSignature.value = false
  emit('update:modelValue', '')
}

onMounted(() => {
  pad = new SignaturePad(canvasRef.value, {
    backgroundColor: 'rgba(0,0,0,0)',
    penColor: '#111827',
    minWidth: 0.7,
    maxWidth: 2.2,
    throttle: 16,
  })
  pad.addEventListener('endStroke', onEndStroke)
  resizeCanvas()
  if (props.modelValue) {
    pad.fromDataURL(props.modelValue)
    hasSignature.value = !pad.isEmpty()
  }
  if (props.readonly) pad.off()
  resizeObserver = new ResizeObserver(() => resizeCanvas())
  resizeObserver.observe(wrapperRef.value)
})

onBeforeUnmount(() => {
  pad?.off()
  resizeObserver?.disconnect()
})

watch(
  () => props.modelValue,
  (val) => {
    if (!pad) return
    const current = pad.isEmpty() ? '' : pad.toDataURL('image/png')
    if (val === current) return
    if (!val) {
      pad.clear()
      hasSignature.value = false
    } else {
      pad.clear()
      pad.fromDataURL(val)
      hasSignature.value = !pad.isEmpty()
    }
  }
)

defineExpose({ clear })
</script>
