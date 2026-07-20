<template>
  <div class="relative" ref="rootRef">
    <input
      ref="inputRef"
      type="text"
      :value="display"
      @focus="onFocus"
      @input="onInput"
      @keydown.down.prevent="moveHighlight(1)"
      @keydown.up.prevent="moveHighlight(-1)"
      @keydown.enter.prevent="selectHighlighted"
      @keydown.esc="close"
      :class="[
        'input pr-8',
        invalid && '!border-red-300 !ring-red-200 focus:!ring-red-300',
      ]"
      :placeholder="placeholder"
      :required="required && !modelValue"
      :disabled="disabled"
      autocomplete="off"
    />
    <button
      v-if="modelValue && !disabled"
      type="button"
      @click="clear"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 rounded"
      title="Limpiar"
      tabindex="-1"
    >
      <IconX class="w-3.5 h-3.5" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="bg-white border border-gray-200 rounded-md shadow-lg text-sm overflow-y-auto"
      >
        <div v-if="!filtered.length" class="px-3 py-2 text-gray-500 text-xs">
          Sin resultados
        </div>
        <button
          v-for="(opt, idx) in filtered"
          :key="opt[optionKey]"
          type="button"
          @mousedown.prevent="select(opt)"
          @mouseenter="highlight = idx"
          :class="[
            'block w-full text-left px-3 py-2 transition border-b border-gray-50 last:border-0',
            idx === highlight ? 'bg-gray-100' : 'hover:bg-gray-50',
          ]"
        >
          <slot name="option" :option="opt">
            <div class="text-gray-900 truncate">{{ getLabel(opt) }}</div>
            <div v-if="getSub(opt)" class="text-[11px] text-gray-500 font-mono truncate">
              {{ getSub(opt) }}
            </div>
          </slot>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import IconX from '~icons/lucide/x'

// Combo con búsqueda genérico (usado por EmployeePicker y por selects con
// muchas opciones, p.ej. QC Producto). El filtrado es client-side sobre
// `options`; para catálogos muy grandes conviene paginar/filtrar server-side
// en su lugar.
const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  optionKey: { type: String, default: 'name' },
  // Campos sobre los que buscar (además del optionKey)
  searchFields: { type: Array, default: () => [] },
  // Texto principal / secundario de cada opción (lista y estado cerrado)
  getLabel: { type: Function, required: true },
  getSub: { type: Function, default: () => '' },
  invalid: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Buscar…' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const rootRef = ref(null)
const inputRef = ref(null)
const dropdownRef = ref(null)
const search = ref('')
const open = ref(false)
const highlight = ref(0)
const dropdownStyle = ref({})

const selected = computed(() =>
  props.options.find((o) => o[props.optionKey] === props.modelValue) || null
)

const display = computed(() => {
  if (open.value) return search.value
  if (!selected.value) return ''
  return props.getLabel(selected.value)
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = props.options
  if (!q) return list.slice(0, 50)
  const fields = [props.optionKey, ...props.searchFields]
  return list
    .filter((o) => fields.some((f) => String(o[f] || '').toLowerCase().includes(q)))
    .slice(0, 50)
})

watch(filtered, () => {
  if (highlight.value >= filtered.value.length) highlight.value = 0
})

function updatePosition() {
  if (!inputRef.value) return
  const rect = inputRef.value.getBoundingClientRect()
  const viewportH = window.innerHeight
  const spaceBelow = viewportH - rect.bottom
  const spaceAbove = rect.top
  const desired = 288 // 18rem
  const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow

  const maxHeight = Math.max(
    160,
    Math.min(desired, placeAbove ? spaceAbove - 8 : spaceBelow - 8)
  )

  dropdownStyle.value = {
    position: 'fixed',
    top: placeAbove ? `${rect.top - maxHeight - 4}px` : `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: 60,
  }
}

watch(open, (v) => {
  if (v) nextTick(updatePosition)
})

function onFocus() {
  if (props.disabled) return
  open.value = true
  search.value = ''
  highlight.value = 0
}

function onInput(e) {
  search.value = e.target.value
  open.value = true
  highlight.value = 0
}

function moveHighlight(delta) {
  if (!open.value) {
    open.value = true
    return
  }
  const n = filtered.value.length
  if (!n) return
  highlight.value = (highlight.value + delta + n) % n
}

function selectHighlighted() {
  if (!open.value || !filtered.value.length) return
  select(filtered.value[highlight.value])
}

function select(opt) {
  emit('update:modelValue', opt[props.optionKey])
  emit('change', opt)
  open.value = false
  search.value = ''
  inputRef.value?.blur()
}

function clear() {
  emit('update:modelValue', '')
  emit('change', null)
  search.value = ''
  open.value = false
}

function close() {
  open.value = false
  search.value = ''
  inputRef.value?.blur()
}

function onDocPointer(e) {
  const inRoot = rootRef.value && rootRef.value.contains(e.target)
  const inDropdown = dropdownRef.value && dropdownRef.value.contains(e.target)
  if (!inRoot && !inDropdown) {
    open.value = false
    search.value = ''
  }
}

function onScrollOrResize() {
  if (open.value) updatePosition()
}

onMounted(() => {
  document.addEventListener('mousedown', onDocPointer)
  document.addEventListener('touchstart', onDocPointer, { passive: true })
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocPointer)
  document.removeEventListener('touchstart', onDocPointer)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>
