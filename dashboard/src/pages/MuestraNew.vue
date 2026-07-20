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
          type="submit"
          form="muestra-new-form"
          class="btn-primary"
          :disabled="saving"
        >
          <IconLoader v-if="saving" class="w-4 h-4 animate-spin" />
          <IconArrowRight v-else class="w-4 h-4" />
          {{ saving ? 'Guardando…' : 'Guardar y continuar' }}
        </button>
      </template>
    </PageHeader>

    <form
      id="muestra-new-form"
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
            <SearchSelect
              v-model="form.qc_producto"
              :options="productos.data || []"
              :search-fields="['itemname']"
              :get-label="(p) => `${p.name} · ${p.itemname || 'Sin producto'}`"
              required
              :placeholder="
                productos.list.loading
                  ? 'Cargando controles abiertos…'
                  : productos.data?.length
                    ? 'Buscar por folio o producto…'
                    : 'No hay controles de calidad en estado Abierto'
              "
              @change="onProductoChange"
            />
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

      <ErrorBanner
        :message="
          productos.list.error
            ? 'No se pudieron cargar los controles de calidad abiertos. Recarga la página para intentar de nuevo.'
            : ''
        "
      />

      <ErrorBanner :message="error" />
    </form>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import {
  MUESTRA_DOCTYPE,
  createMuestraDoc,
  useProductosAbiertos,
} from '@/data/muestras'
import { useCreateForm } from '@/composables/createForm'
import { nowDefaults } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import IconLoader from '~icons/lucide/loader-circle'
import IconArrowRight from '~icons/lucide/arrow-right'
import IconInfo from '~icons/lucide/info'

const productos = useProductosAbiertos()
const now = nowDefaults()

const form = reactive({
  doctype: MUESTRA_DOCTYPE,
  qc_producto: '',
  itemname: '',
  itemcode: '',
  batchnum: '',
  docdate: now.date,
  hora_muestra: now.time,
  comentarios: '',
})

function onProductoChange(prod) {
  error.value = ''
  form.itemname = prod?.itemname || ''
  form.itemcode = prod?.qc_template || ''
}

const create = createMuestraDoc()

const { saving, error, onSubmit } = useCreateForm({
  create,
  // Al insertar, el servidor genera detalle_resultados desde la plantilla
  redirect: (doc) => `/muestras/${encodeURIComponent(doc.name)}`,
  validate() {
    if (!form.qc_producto)
      return 'Selecciona el control de calidad del producto.'
    if (!form.batchnum) return 'Ingresa el número de lote.'
  },
  buildDoc: () => ({ ...form }),
})
</script>
