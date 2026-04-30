<template>
  <div
    class="inline-flex rounded-md border border-gray-200 p-0.5 bg-gray-50 text-xs select-none"
  >
    <button
      type="button"
      @click="set('Conforme')"
      :disabled="readonly"
      :class="[
        'px-2.5 py-1 font-medium rounded transition disabled:cursor-default',
        modelValue === 'Conforme'
          ? 'bg-white text-green-700 shadow-sm ring-1 ring-green-200'
          : 'text-gray-500 hover:text-gray-900',
      ]"
    >
      Conforme
    </button>
    <button
      type="button"
      @click="set('No Conforme')"
      :disabled="readonly"
      :class="[
        'px-2.5 py-1 font-medium rounded transition disabled:cursor-default',
        modelValue === 'No Conforme'
          ? 'bg-white text-red-700 shadow-sm ring-1 ring-red-200'
          : 'text-gray-500 hover:text-gray-900',
      ]"
    >
      No Conforme
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function set(v) {
  if (props.readonly) return
  emit('update:modelValue', props.modelValue === v ? '' : v)
}
</script>
