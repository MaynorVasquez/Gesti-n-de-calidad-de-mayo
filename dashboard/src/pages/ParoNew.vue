<template>
  <div>
    <PageHeader
      title="Nuevo paro de producción"
      subtitle="Registro de paros durante el control de calidad"
      :back="'/paros'"
    >
      <template #actions>
        <router-link to="/paros" class="btn-secondary">Cancelar</router-link>
        <button
          type="button"
          class="btn-primary"
          :disabled="saving"
          @click="onSubmit"
        >
          <IconLoader v-if="saving" class="w-4 h-4 animate-spin" />
          <IconCheck v-else class="w-4 h-4" />
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </template>
    </PageHeader>

    <form
      @submit.prevent="onSubmit"
      class="px-4 sm:px-6 lg:px-10 py-6 max-w-3xl space-y-5"
    >
      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">
          Información general
        </h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="field-label">Control de calidad del producto</label>
            <select
              v-model="form.qc_producto"
              required
              class="select w-full"
              @change="onProductoChange"
            >
              <option value="" disabled>
                {{
                  productos.list.loading
                    ? 'Cargando controles abiertos…'
                    : productos.data?.length
                      ? 'Selecciona un control de calidad abierto…'
                      : 'No hay controles de calidad en estado Abierto'
                }}
              </option>
              <option v-for="p in productos.data || []" :key="p.name" :value="p.name">
                {{ p.name }} · {{ p.itemname || 'Sin producto' }}
              </option>
            </select>
            <p v-if="form.itemname" class="text-xs text-gray-500 mt-1.5">
              Producto:
              <span class="font-medium text-gray-700">{{ form.itemname }}</span>
              <span v-if="form.itemcode" class="text-gray-400">
                · {{ form.itemcode }}</span
              >
            </p>
          </div>
          <div>
            <label class="field-label">Fecha</label>
            <input type="date" v-model="form.docdate" required class="input" />
          </div>
          <div>
            <label class="field-label">Hora</label>
            <input type="time" v-model="form.hora" required class="input" />
          </div>
          <div>
            <label class="field-label">Status</label>
            <select v-model="form.status" class="select w-full">
              <option v-for="s in PARO_STATUSES" :key="s" :value="s">
                {{ paroStatusLabel(s) }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <section class="card p-5">
        <label class="field-label">Motivo del paro / comentarios</label>
        <textarea
          v-model="form.comentarios"
          rows="5"
          required
          class="input"
          placeholder="Describe el motivo del paro de producción, las acciones tomadas y cualquier observación relevante…"
        />
      </section>

      <div
        v-if="error"
        class="card p-3 border-red-200 bg-red-50 text-red-700 text-sm flex items-start gap-2"
      >
        <IconAlert class="w-4 h-4 mt-0.5 shrink-0" />
        <span>{{ error }}</span>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  PARO_DOCTYPE,
  PARO_STATUSES,
  paroStatusLabel,
  createParoDoc,
} from '@/data/paros'
import { useProductosAbiertos } from '@/data/muestras'
import PageHeader from '@/components/PageHeader.vue'
import IconCheck from '~icons/lucide/check'
import IconLoader from '~icons/lucide/loader-circle'
import IconAlert from '~icons/lucide/alert-circle'

const router = useRouter()
const productos = useProductosAbiertos()

const now = new Date()
const yyyy = now.getFullYear()
const mm = String(now.getMonth() + 1).padStart(2, '0')
const dd = String(now.getDate()).padStart(2, '0')
const hh = String(now.getHours()).padStart(2, '0')
const mi = String(now.getMinutes()).padStart(2, '0')

const form = reactive({
  doctype: PARO_DOCTYPE,
  qc_producto: '',
  itemname: '',
  itemcode: '',
  docdate: `${yyyy}-${mm}-${dd}`,
  hora: `${hh}:${mi}:00`,
  status: 'Draft',
  comentarios: '',
})

const saving = ref(false)
const error = ref('')

function onProductoChange() {
  error.value = ''
  const prod = (productos.data || []).find((p) => p.name === form.qc_producto)
  form.itemname = prod?.itemname || ''
  form.itemcode = prod?.qc_template || ''
}

const create = createParoDoc()

async function onSubmit() {
  if (!form.qc_producto) {
    error.value = 'Selecciona el control de calidad del producto.'
    return
  }
  if (!form.comentarios.trim()) {
    error.value = 'Describe el motivo del paro de producción.'
    return
  }
  error.value = ''
  saving.value = true
  try {
    const doc = await create.submit(form)
    router.push(`/paros/${encodeURIComponent(doc.name)}`)
  } catch (e) {
    error.value = e.messages?.[0] || e.message || 'Error al guardar.'
  } finally {
    saving.value = false
  }
}
</script>
