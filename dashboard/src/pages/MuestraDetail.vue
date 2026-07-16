<template>
  <div>
    <PageHeader
      :title="doc.doc?.name || name"
      :subtitle="subtitle"
      :back="'/muestras'"
    >
      <template #actions>
        <a
          :href="docUrl"
          target="_blank"
          rel="noopener"
          class="btn-secondary"
          title="Abrir en Desk"
        >
          <IconExternalLink class="w-4 h-4" />
          Abrir en Desk
        </a>
        <button
          v-if="editable"
          @click="onSave"
          :disabled="saver.loading || submitter.loading"
          class="btn-secondary"
        >
          <IconLoader v-if="saver.loading" class="w-4 h-4 animate-spin" />
          <IconSave v-else class="w-4 h-4" />
          Guardar
        </button>
        <button
          v-if="editable"
          @click="onSubmit"
          :disabled="submitter.loading || saver.loading"
          class="btn-primary"
        >
          <IconLoader v-if="submitter.loading" class="w-4 h-4 animate-spin" />
          <IconCheck v-else class="w-4 h-4" />
          Enviar
        </button>
        <button
          v-if="doc.doc?.docstatus === 1"
          @click="onCancel"
          :disabled="canceler.loading"
          class="btn-danger"
        >
          <IconX class="w-4 h-4" />
          Cancelar
        </button>
      </template>
    </PageHeader>

    <LoadingCard v-if="doc.loading && !doc.doc" class="m-6 lg:mx-10" />

    <div v-else-if="doc.error" class="px-4 sm:px-6 lg:px-10 py-12 text-center">
      <div class="text-red-600 text-sm mb-3">
        {{
          doc.error?.messages?.[0] ||
          doc.error?.message ||
          'No se pudo cargar el documento.'
        }}
      </div>
      <router-link to="/muestras" class="btn-secondary">
        Volver a la lista
      </router-link>
    </div>

    <div
      v-else-if="doc.doc"
      class="px-4 sm:px-6 lg:px-10 py-6 max-w-5xl space-y-5"
    >
      <DocMetaLine :doc="doc.doc" />

      <ErrorBanner :message="actionError" />

      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">
          Información general
        </h3>
        <div class="grid sm:grid-cols-3 gap-4">
          <div>
            <div class="field-label">Control de calidad</div>
            <a
              :href="`/app/qc-producto/${encodeURIComponent(doc.doc.qc_producto)}`"
              target="_blank"
              rel="noopener"
              class="text-sm font-mono text-blue-600 hover:underline"
            >
              {{ doc.doc.qc_producto }}
            </a>
          </div>
          <div>
            <div class="field-label">Producto</div>
            <div class="text-sm text-gray-900">{{ doc.doc.itemname || '—' }}</div>
          </div>
          <div>
            <div class="field-label">Lote</div>
            <div class="text-sm font-mono text-gray-900">
              {{ doc.doc.batchnum || '—' }}
            </div>
          </div>
          <div>
            <div class="field-label">Fecha</div>
            <div class="text-sm text-gray-900">{{ formatDate(doc.doc.docdate) }}</div>
          </div>
          <div>
            <div class="field-label">Hora</div>
            <div class="text-sm text-gray-900">
              {{ formatTime(doc.doc.hora_muestra) }}
            </div>
          </div>
        </div>
      </section>

      <section class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Resumen</h3>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ rows.length }}
              {{ rows.length === 1 ? 'parámetro evaluado' : 'parámetros evaluados' }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              Cumplimiento
            </div>
            <div class="text-2xl font-semibold" :class="overallColor">
              {{ summary.percent }}%
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div class="border border-gray-200 rounded-md p-3">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              Conformes
            </div>
            <div class="text-lg font-semibold text-green-700">
              {{ summary.conformes }}
            </div>
          </div>
          <div class="border border-gray-200 rounded-md p-3">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              No conformes
            </div>
            <div class="text-lg font-semibold text-red-700">
              {{ summary.noConformes }}
            </div>
          </div>
          <div class="border border-gray-200 rounded-md p-3">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              Sin evaluar
            </div>
            <div class="text-lg font-semibold text-gray-500">
              {{ summary.sinEvaluar }}
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-900">
          Resultados por categoría
        </h3>

        <div
          v-if="!rows.length"
          class="card p-10 text-center text-sm text-gray-500"
        >
          Sin detalle registrado.
        </div>

        <div
          v-for="group in grouped"
          :key="group.categoria"
          class="card overflow-hidden"
        >
          <div
            class="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/40"
          >
            <IconTag class="w-4 h-4 text-gray-400" />
            <h4 class="text-sm font-semibold text-gray-900">
              {{ group.categoria }}
            </h4>
            <span class="text-xs text-gray-400">
              {{ group.rows.length }} parámetro{{ group.rows.length > 1 ? 's' : '' }}
            </span>
          </div>

          <div class="divide-y divide-gray-50">
            <div
              v-for="row in group.rows"
              :key="row.name"
              class="px-5 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap"
            >
              <div class="flex-1 min-w-[160px]">
                <div class="text-sm text-gray-800">{{ row.parametro }}</div>
                <div
                  v-if="row.tipo_parametro === 'Número' && hasRange(row)"
                  class="text-xs text-gray-500 mt-0.5"
                >
                  Rango: {{ row.valor_minimo }} – {{ row.valor_maximo }}
                </div>
              </div>

              <template v-if="editable">
                <template v-if="row.tipo_parametro === 'Número'">
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      v-model.number="row.resultados"
                      class="input w-32 text-right"
                      :class="fueraDeRango(row) ? '!border-red-400 !bg-red-50' : ''"
                      placeholder="Resultado"
                    />
                    <span
                      v-if="fueraDeRango(row)"
                      class="badge badge-red shrink-0"
                    >
                      <IconAlert class="w-3 h-3" />
                      Fuera de rango
                    </span>
                    <span
                      v-else-if="hasResultado(row)"
                      class="badge badge-green shrink-0"
                    >
                      <IconCheck class="w-3 h-3" />
                      OK
                    </span>
                  </div>
                </template>
                <template v-else>
                  <ConformidadToggle v-model="row.conformidad" />
                </template>
              </template>
              <template v-else>
                <div
                  v-if="row.tipo_parametro === 'Número'"
                  class="text-sm font-mono text-gray-900 w-24 text-right"
                >
                  {{ hasResultado(row) ? row.resultados : '—' }}
                </div>

                <span class="badge shrink-0" :class="rowBadgeClass(row)">
                  <IconAlert v-if="rowConforme(row) === false" class="w-3 h-3" />
                  <IconCheck
                    v-else-if="rowConforme(row) === true"
                    class="w-3 h-3"
                  />
                  {{ rowBadgeLabel(row) }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section v-if="editable" class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-2">Comentarios</h3>
        <textarea
          v-model="doc.doc.comentarios"
          rows="3"
          class="input"
          placeholder="Observaciones de la muestra (opcional)"
        />
      </section>
      <section v-else-if="doc.doc.comentarios" class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-2">Comentarios</h3>
        <div class="text-sm text-gray-700 whitespace-pre-wrap">{{ doc.doc.comentarios }}</div>
      </section>

      <DeskEditNote v-if="!editable" :href="docUrl" />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import {
  muestraResources,
  hasResultado,
  hasRange,
  fueraDeRango,
  rowConforme,
  muestraSummary,
  groupByCategoria,
} from '@/data/muestras'
import { useDocActions } from '@/composables/docActions'
import { formatDate, formatTime } from '@/utils/format'
import { deskUrl, scoreColor } from '@/utils/docstatus'
import PageHeader from '@/components/PageHeader.vue'
import ConformidadToggle from '@/components/ConformidadToggle.vue'
import LoadingCard from '@/components/LoadingCard.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import DocMetaLine from '@/components/DocMetaLine.vue'
import DeskEditNote from '@/components/DeskEditNote.vue'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import IconLoader from '~icons/lucide/loader-circle'
import IconExternalLink from '~icons/lucide/external-link'
import IconAlert from '~icons/lucide/alert-circle'
import IconTag from '~icons/lucide/tag'
import IconSave from '~icons/lucide/save'

const props = defineProps({
  name: { type: String, required: true },
})

function derivarConformidadNumerica() {
  for (const row of rows.value) {
    if (row.tipo_parametro === 'Número' && hasResultado(row)) {
      row.conformidad = fueraDeRango(row) ? 'No Conforme' : 'Conforme'
    }
  }
}

const {
  doc,
  saver,
  submitter,
  canceler,
  editable,
  actionError,
  onSave,
  onSubmit,
  onCancel,
} = useDocActions({
  resources: muestraResources,
  name: props.name,
  entity: {
    articulo: 'la muestra',
    enviadaLabel: 'enviada',
    submitMessage:
      'Una vez enviada, el documento queda firme y no podrá modificarse después. Los parámetros obligatorios deben estar completos.',
  },
  before: derivarConformidadNumerica,
})

const rows = computed(() => doc.doc?.detalle_resultados || [])

// El campo Float llega en 0 por defecto desde el servidor; en borrador,
// un 0 sin conformidad derivada significa "sin evaluar" → mostrar vacío.
// Se ejecuta solo cuando cambia la identidad del doc (carga/reload).
watch(
  () => doc.doc,
  (d) => {
    if (!d || d.docstatus !== 0) return
    for (const row of d.detalle_resultados || []) {
      if (
        row.tipo_parametro === 'Número' &&
        Number(row.resultados) === 0 &&
        !row.conformidad
      ) {
        row.resultados = null
      }
    }
  },
  { immediate: true }
)

const grouped = computed(() => groupByCategoria(rows.value))
const summary = computed(() => muestraSummary(rows.value))

const subtitle = computed(() => {
  if (!doc.doc) return 'Cargando…'
  const producto = doc.doc.itemname || doc.doc.qc_producto
  const lote = doc.doc.batchnum ? ` · Lote ${doc.doc.batchnum}` : ''
  const paso = editable.value ? 'Paso 2 de 2 · Registra los resultados · ' : ''
  return `${paso}${producto}${lote}`
})

const overallColor = computed(() => {
  if (!summary.value.evaluated) return 'text-gray-900'
  return scoreColor(summary.value.percent)
})

const docUrl = computed(() => deskUrl('qc-producto-muestra', props.name))

function rowBadgeLabel(row) {
  const c = rowConforme(row)
  if (c === null) return 'Sin evaluar'
  if (c === false)
    return row.tipo_parametro === 'Número' && fueraDeRango(row)
      ? 'Fuera de rango'
      : 'No Conforme'
  return 'Conforme'
}

function rowBadgeClass(row) {
  const c = rowConforme(row)
  if (c === true) return 'badge-green'
  if (c === false) return 'badge-red'
  return 'badge-gray'
}
</script>
