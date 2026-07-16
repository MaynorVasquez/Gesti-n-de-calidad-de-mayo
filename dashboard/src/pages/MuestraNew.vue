<template>
  <div>
    <PageHeader
      title="Nueva muestra de producto"
      subtitle="Paso 1 de 2 · Datos generales de la muestra"
      :back="'/muestras'"
    >
      <template #actions>
        <router-link to="/muestras" class="btn-secondary">Cancelar</router-link>
        <button
          type="button"
          class="btn-primary"
          :disabled="saving"
          @click="onSubmit"
        >
          <IconLoader v-if="saving" class="w-4 h-4 animate-spin" />
          <IconArrowRight v-else class="w-4 h-4" />
          {{ saving ? 'Guardando…' : 'Guardar y continuar' }}
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
            <label class="field-label">Lote</label>
            <input
              type="text"
              v-model="form.batchnum"
              required
              class="input"
              placeholder="Número de lote"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="field-label">Fecha</label>
              <input type="date" v-model="form.docdate" required class="input" />
            </div>
            <div>
              <label class="field-label">Hora</label>
              <input type="time" v-model="form.hora_muestra" required class="input" />
            </div>
          </div>
        </div>
      </section>

      <section class="card p-5">
        <label class="field-label">Comentarios</label>
        <textarea
          v-model="form.comentarios"
          rows="3"
          class="input"
          placeholder="Observaciones de la muestra (opcional)"
        />
      </section>

      <div
        class="card p-4 border-blue-100 bg-blue-50/60 text-blue-800 text-sm flex items-start gap-2"
      >
        <IconInfo class="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Al guardar se cargarán los parámetros configurados en la plantilla del
          control de calidad y podrás registrar los resultados (paso 2).
        </span>
      </div>

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
  MUESTRA_DOCTYPE,
  createMuestraDoc,
  useProductosAbiertos,
} from '@/data/muestras'
import PageHeader from '@/components/PageHeader.vue'
import IconLoader from '~icons/lucide/loader-circle'
import IconAlert from '~icons/lucide/alert-circle'
import IconArrowRight from '~icons/lucide/arrow-right'
import IconInfo from '~icons/lucide/info'

const router = useRouter()
const productos = useProductosAbiertos()

const now = new Date()
const yyyy = now.getFullYear()
const mm = String(now.getMonth() + 1).padStart(2, '0')
const dd = String(now.getDate()).padStart(2, '0')
const hh = String(now.getHours()).padStart(2, '0')
const mi = String(now.getMinutes()).padStart(2, '0')

const form = reactive({
  doctype: MUESTRA_DOCTYPE,
  qc_producto: '',
  itemname: '',
  itemcode: '',
  batchnum: '',
  docdate: `${yyyy}-${mm}-${dd}`,
  hora_muestra: `${hh}:${mi}:00`,
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

const create = createMuestraDoc()

async function onSubmit() {
  if (!form.qc_producto) {
    error.value = 'Selecciona el control de calidad del producto.'
    return
  }
  if (!form.batchnum) {
    error.value = 'Ingresa el número de lote.'
    return
  }
  error.value = ''
  saving.value = true
  try {
    // Al insertar, el servidor genera detalle_resultados desde la plantilla
    const doc = await create.submit(form)
    router.push(`/muestras/${encodeURIComponent(doc.name)}`)
  } catch (e) {
    error.value = e.messages?.[0] || e.message || 'Error al guardar.'
  } finally {
    saving.value = false
  }
}
</script>
