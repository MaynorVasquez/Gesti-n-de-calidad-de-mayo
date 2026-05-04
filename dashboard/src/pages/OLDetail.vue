<template>
  <div>
    <PageHeader
      :title="doc.doc?.name || name"
      :subtitle="subtitle"
      :back="'/limpieza'"
    >
      <template #actions>
        <a
          :href="deskUrl"
          target="_blank"
          rel="noopener"
          class="btn-secondary"
          title="Abrir en Desk"
        >
          <IconExternalLink class="w-4 h-4" />
          Abrir en Desk
        </a>
        <button
          v-if="doc.doc?.docstatus === 0"
          @click="onSubmit"
          :disabled="submitter.loading"
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

    <div
      v-if="doc.loading && !doc.doc"
      class="px-4 sm:px-6 lg:px-10 py-16 text-center text-gray-500 text-sm"
    >
      <IconLoader class="w-5 h-5 mx-auto animate-spin mb-2" />
      Cargando…
    </div>

    <div v-else-if="doc.error" class="px-4 sm:px-6 lg:px-10 py-12 text-center">
      <div class="text-red-600 text-sm mb-3">
        {{
          doc.error?.messages?.[0] ||
          doc.error?.message ||
          'No se pudo cargar el documento.'
        }}
      </div>
      <router-link to="/limpieza" class="btn-secondary">
        Volver a la lista
      </router-link>
    </div>

    <div
      v-else-if="doc.doc"
      class="px-4 sm:px-6 lg:px-10 py-6 max-w-5xl space-y-5"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <span class="badge" :class="docstatusClass(doc.doc.docstatus)">
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="dotClass(doc.doc.docstatus)"
          />
          {{ docstatusLabel(doc.doc.docstatus) }}
        </span>
        <span class="text-xs text-gray-500">
          Modificado {{ formatDateTime(doc.doc.modified) }}
        </span>
        <span class="text-xs text-gray-400">·</span>
        <span class="text-xs text-gray-500">por {{ doc.doc.modified_by }}</span>
      </div>

      <section class="card p-5">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 mb-3">
              Información general
            </h3>
            <div class="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <div class="field-label">Folio</div>
                <div class="text-sm font-mono text-gray-900">
                  {{ doc.doc.name }}
                </div>
              </div>
              <div>
                <div class="field-label">Usuario</div>
                <div class="text-sm text-gray-900">
                  {{ doc.doc.full_user_name || '—' }}
                </div>
              </div>
              <div>
                <div class="field-label">Fecha</div>
                <div class="text-sm text-gray-900">
                  {{ formatDate(doc.doc.fecha_inspeccion) }}
                </div>
              </div>
              <div>
                <div class="field-label">Hora</div>
                <div class="text-sm text-gray-900">
                  {{ formatTime(doc.doc.hora_inspeccion) }}
                </div>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              Cumplimiento total
            </div>
            <div
              class="text-3xl font-semibold tabular-nums"
              :class="totalColor"
            >
              {{ totalNumber.toFixed(1) }}%
            </div>
            <div class="text-xs text-gray-500">
              {{ rows.length }}
              {{ rows.length === 1 ? 'área evaluada' : 'áreas evaluadas' }}
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-900">Detalle por área</h3>

        <div
          v-if="!rows.length"
          class="card p-10 text-center text-sm text-gray-500"
        >
          Sin áreas registradas.
        </div>

        <div
          v-for="(row, i) in rows"
          :key="row.name || i"
          class="card overflow-hidden"
        >
          <div
            class="px-5 py-3 border-b border-gray-100 bg-gray-50/40 flex items-center gap-3 flex-wrap"
          >
            <div
              class="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center shrink-0"
            >
              {{ i + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">
                {{ row.area || '—' }}
              </div>
              <div class="text-xs text-gray-500 truncate">
                {{ row.departamento || 'Sin departamento' }}
              </div>
            </div>
            <span
              v-if="rowSummary(row).noConformes > 0"
              class="badge badge-red"
            >
              {{ rowSummary(row).noConformes }} no conforme{{
                rowSummary(row).noConformes > 1 ? 's' : ''
              }}
            </span>
            <span v-else class="badge badge-green">
              <IconCheck class="w-3 h-3" />
              Todo conforme
            </span>
            <div class="text-right">
              <div class="text-[10px] text-gray-500 uppercase tracking-wider">
                Promedio
              </div>
              <div
                class="text-sm font-semibold tabular-nums"
                :class="rowScoreColor(row)"
              >
                {{ rowAvg(row).toFixed(1) }}%
              </div>
            </div>
          </div>

          <div class="p-5 space-y-1">
            <div
              v-for="c in CRITERIA"
              :key="c.key"
              class="grid grid-cols-12 gap-3 items-center py-2 border-b border-gray-50 last:border-0"
            >
              <span class="col-span-12 sm:col-span-6 text-sm text-gray-700">
                {{ c.label }}
              </span>
              <div class="col-span-7 sm:col-span-3">
                <span class="badge" :class="conformidadClass(row[c.key])">
                  {{ row[c.key] || 'Sin evaluar' }}
                </span>
              </div>
              <div
                class="col-span-5 sm:col-span-3 text-right text-sm tabular-nums"
                :class="
                  Number(row[c.resultKey]) < 100
                    ? 'font-medium text-red-700'
                    : 'text-gray-500'
                "
              >
                {{ formatScore(row[c.resultKey]) }}%
              </div>
            </div>
          </div>

          <div
            v-if="row.observaciones || row.acciones_correctivas || row.fecha_cierre"
            class="px-5 pb-5 grid sm:grid-cols-2 gap-4"
          >
            <div v-if="row.observaciones">
              <div class="field-label">Observaciones</div>
              <div
                class="text-sm text-gray-700 prose prose-sm max-w-none"
                v-html="row.observaciones"
              />
            </div>
            <div v-if="row.acciones_correctivas">
              <div class="field-label">Acciones correctivas</div>
              <div
                class="text-sm text-gray-700 prose prose-sm max-w-none"
                v-html="row.acciones_correctivas"
              />
            </div>
            <div v-if="row.fecha_cierre">
              <div class="field-label">Fecha de cierre</div>
              <div class="text-sm text-gray-700">
                {{ formatDate(row.fecha_cierre) }}
              </div>
            </div>
          </div>

          <div
            v-if="row.nombre_responsable || row.firma_responsable"
            class="px-5 pb-5 grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4"
          >
            <div>
              <div class="field-label">Responsable</div>
              <div class="text-sm text-gray-900">
                {{ row.nombre_responsable || '—' }}
              </div>
            </div>
            <div>
              <div class="field-label">Firma del responsable</div>
              <div
                v-if="row.firma_responsable"
                class="border border-gray-200 rounded-md bg-white p-2 inline-block"
              >
                <img
                  :src="row.firma_responsable"
                  alt="Firma del responsable"
                  class="max-h-20 object-contain"
                />
              </div>
              <div v-else class="text-xs text-gray-400">Sin firma</div>
            </div>
          </div>
        </div>
      </section>

      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">
          Firma del Supervisor de Calidad
        </h3>
        <div
          v-if="doc.doc.firma_supervisor_calidad"
          class="border border-gray-200 rounded-md bg-white p-3 inline-block"
        >
          <img
            :src="doc.doc.firma_supervisor_calidad"
            alt="Firma supervisor"
            class="max-h-32 object-contain"
          />
        </div>
        <div
          v-else
          class="border border-dashed border-gray-200 rounded-md bg-gray-50/50 px-3 py-8 text-center text-xs text-gray-400 max-w-md"
        >
          Sin firma registrada
        </div>
      </section>

      <p class="text-xs text-gray-500">
        Para editar este documento, abrí
        <a
          :href="deskUrl"
          target="_blank"
          rel="noopener"
          class="text-blue-600 hover:underline"
        >
          en Desk </a
        >.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  useOLDoc,
  submitOLDoc,
  cancelOLDoc,
  LIMPIEZA_CRITERIA as CRITERIA,
  rowAverage,
  rowSummary,
} from '@/data/limpieza'
import { useConfirm } from '@/composables/confirm'
import PageHeader from '@/components/PageHeader.vue'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import IconLoader from '~icons/lucide/loader-circle'
import IconExternalLink from '~icons/lucide/external-link'

const props = defineProps({
  name: { type: String, required: true },
})

const doc = useOLDoc(props.name)
const submitter = submitOLDoc()
const canceler = cancelOLDoc()
const confirm = useConfirm()

const rows = computed(() => doc.doc?.listado_areas || [])

const subtitle = computed(() => {
  if (!doc.doc) return 'Cargando…'
  const f = formatDate(doc.doc.fecha_inspeccion)
  const h = formatTime(doc.doc.hora_inspeccion)
  return `Inspección del ${f} a las ${h}`
})

const totalNumber = computed(() => {
  const v = Number(doc.doc?.total)
  return Number.isFinite(v) ? v : 0
})

const totalColor = computed(() => {
  if (!rows.value.length) return 'text-gray-400'
  const v = totalNumber.value
  if (v >= 90) return 'text-green-700'
  if (v >= 70) return 'text-yellow-700'
  return 'text-red-700'
})

const deskUrl = computed(
  () => `/app/qc-orden-y-limpieza/${encodeURIComponent(props.name)}`
)

function rowAvg(row) {
  return rowAverage(row)
}
function rowScoreColor(row) {
  const v = rowAverage(row)
  if (v >= 90) return 'text-green-700'
  if (v >= 70) return 'text-yellow-700'
  return 'text-red-700'
}

function conformidadClass(v) {
  if (v === 'Conforme') return 'badge-green'
  if (v === 'No Conforme') return 'badge-red'
  return 'badge-gray'
}

function formatScore(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(0)
}

function docstatusLabel(s) {
  if (s === 1) return 'Enviado'
  if (s === 2) return 'Cancelado'
  return 'Borrador'
}
function docstatusClass(s) {
  if (s === 1) return 'badge-green'
  if (s === 2) return 'badge-red'
  return 'badge-yellow'
}
function dotClass(s) {
  if (s === 1) return 'bg-green-500'
  if (s === 2) return 'bg-red-500'
  return 'bg-yellow-500'
}
function formatDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).split('-')
  if (!y || !m || !day) return d
  return `${day}/${m}/${y}`
}
function formatTime(t) {
  if (!t) return '—'
  return String(t).slice(0, 5)
}
function formatDateTime(s) {
  if (!s) return ''
  try {
    return new Date(s).toLocaleString('es', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return s
  }
}

async function onSubmit() {
  const ok = await confirm({
    title: '¿Enviar la inspección?',
    message:
      'Una vez enviada, el documento queda firme y no podrá modificarse después.',
    confirmText: 'Enviar',
    cancelText: 'Volver',
    variant: 'primary',
  })
  if (!ok) return
  try {
    await submitter.submit(doc.doc)
    await doc.reload()
  } catch (e) {
    alert(e.messages?.[0] || e.message || 'Error al enviar.')
  }
}

async function onCancel() {
  const ok = await confirm({
    title: '¿Cancelar la inspección?',
    message:
      'Esta acción no se puede deshacer. El documento quedará marcado como cancelado.',
    confirmText: 'Sí, cancelar',
    cancelText: 'Volver',
    variant: 'danger',
  })
  if (!ok) return
  try {
    await canceler.submit({
      doctype: doc.doc.doctype,
      name: doc.doc.name,
    })
    await doc.reload()
  } catch (e) {
    alert(e.messages?.[0] || e.message || 'Error al cancelar.')
  }
}
</script>
