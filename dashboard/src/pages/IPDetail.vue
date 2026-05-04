<template>
  <div>
    <PageHeader
      :title="doc.doc?.name || name"
      :subtitle="subtitle"
      :back="'/personal'"
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
      <router-link to="/personal" class="btn-secondary">
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
        <h3 class="text-sm font-semibold text-gray-900 mb-4">
          Información general
        </h3>
        <div class="grid sm:grid-cols-3 gap-4">
          <div>
            <div class="field-label">Folio</div>
            <div class="text-sm font-mono text-gray-900">{{ doc.doc.name }}</div>
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
          <div>
            <div class="field-label">Supervisor</div>
            <div class="text-sm text-gray-900">{{ doc.doc.supervisor || '—' }}</div>
          </div>
        </div>
      </section>

      <section class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Resumen</h3>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ rows.length }}
              {{ rows.length === 1 ? 'empleado evaluado' : 'empleados evaluados' }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              Cumplimiento
            </div>
            <div class="text-2xl font-semibold" :class="overall.color">
              {{ overall.percent }}%
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div class="border border-gray-200 rounded-md p-3">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              Conformes
            </div>
            <div class="text-lg font-semibold text-green-700">
              {{ overall.conformes }}
            </div>
          </div>
          <div class="border border-gray-200 rounded-md p-3">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              No conformes
            </div>
            <div class="text-lg font-semibold text-red-700">
              {{ overall.noConformes }}
            </div>
          </div>
          <div class="border border-gray-200 rounded-md p-3">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              Sin evaluar
            </div>
            <div class="text-lg font-semibold text-gray-500">
              {{ overall.unset }}
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-900">Detalle por empleado</h3>

        <div
          v-if="!rows.length"
          class="card p-10 text-center text-sm text-gray-500"
        >
          Sin detalle registrado.
        </div>

        <div
          v-for="(row, i) in rows"
          :key="row.name || i"
          class="card overflow-hidden"
        >
          <div
            class="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/40"
          >
            <div
              class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center shrink-0"
            >
              {{ rowInitials(row) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">
                {{ row.nombre_empleado || row.codigo_empleado }}
              </div>
              <div class="text-xs text-gray-500 font-mono">
                {{ row.codigo_empleado }}
              </div>
            </div>
            <span
              class="badge"
              :class="estadoClass(row.estado)"
            >
              {{ row.estado || '—' }}
            </span>
            <span
              v-if="rowSummary(row).noConformes > 0"
              class="badge badge-red"
            >
              {{ rowSummary(row).noConformes }} no conforme{{
                rowSummary(row).noConformes > 1 ? 's' : ''
              }}
            </span>
            <span
              v-else-if="rowSummary(row).evaluated > 0"
              class="badge badge-green"
            >
              <IconCheck class="w-3 h-3" />
              Todo conforme
            </span>
          </div>

          <div class="p-5">
            <div class="grid sm:grid-cols-2 gap-x-6">
              <div
                v-for="c in CRITERIA"
                :key="c.key"
                class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 sm:[&:nth-last-child(2)]:border-0"
              >
                <span class="text-sm text-gray-700">{{ c.label }}</span>
                <span
                  class="badge"
                  :class="conformidadClass(row[c.key])"
                >
                  {{ row[c.key] || 'Sin evaluar' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="row.oac" class="px-5 pb-5">
            <div class="field-label">Observaciones y acciones correctivas</div>
            <div
              class="text-sm text-gray-700 prose prose-sm max-w-none"
              v-html="row.oac"
            />
          </div>
        </div>
      </section>

      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Firmas</h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <div class="field-label">Supervisor de Calidad</div>
            <div
              v-if="doc.doc.supervidor_firma"
              class="border border-gray-200 rounded-md bg-white p-3 flex items-center justify-center"
            >
              <img
                :src="doc.doc.supervidor_firma"
                alt="Firma supervisor"
                class="max-h-32 object-contain"
              />
            </div>
            <div
              v-else
              class="border border-dashed border-gray-200 rounded-md bg-gray-50/50 px-3 py-8 text-center text-xs text-gray-400"
            >
              Sin firma registrada
            </div>
          </div>
          <div>
            <div class="field-label">Coordinador de Calidad</div>
            <div
              v-if="doc.doc.coordinador_firma"
              class="border border-gray-200 rounded-md bg-white p-3 flex items-center justify-center"
            >
              <img
                :src="doc.doc.coordinador_firma"
                alt="Firma coordinador"
                class="max-h-32 object-contain"
              />
            </div>
            <div
              v-else
              class="border border-dashed border-gray-200 rounded-md bg-gray-50/50 px-3 py-8 text-center text-xs text-gray-400"
            >
              Sin firma registrada
            </div>
          </div>
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
  useIPDoc,
  submitIPDoc,
  cancelIPDoc,
  PERSONAL_CRITERIA as CRITERIA,
  rowConformity,
} from '@/data/personal'
import { useConfirm } from '@/composables/confirm'
import PageHeader from '@/components/PageHeader.vue'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import IconLoader from '~icons/lucide/loader-circle'
import IconExternalLink from '~icons/lucide/external-link'

const props = defineProps({
  name: { type: String, required: true },
})

const doc = useIPDoc(props.name)
const submitter = submitIPDoc()
const canceler = cancelIPDoc()
const confirm = useConfirm()

const rows = computed(() => doc.doc?.table_nnkn || [])

const subtitle = computed(() => {
  if (!doc.doc) return 'Cargando…'
  const f = formatDate(doc.doc.fecha_inspeccion)
  const h = formatTime(doc.doc.hora_inspeccion)
  return `Inspección del ${f} a las ${h}`
})

const overall = computed(() => {
  let conformes = 0
  let noConformes = 0
  let unset = 0
  for (const row of rows.value) {
    for (const c of CRITERIA) {
      const v = row[c.key]
      if (v === 'Conforme') conformes++
      else if (v === 'No Conforme') noConformes++
      else unset++
    }
  }
  const evaluated = conformes + noConformes
  const percent = evaluated ? Math.round((conformes / evaluated) * 100) : 0
  let color = 'text-gray-900'
  if (evaluated > 0) {
    if (percent >= 90) color = 'text-green-700'
    else if (percent >= 70) color = 'text-yellow-700'
    else color = 'text-red-700'
  }
  return { conformes, noConformes, unset, percent, color }
})

const deskUrl = computed(
  () => `/app/qc-inspeccion-de-personal/${encodeURIComponent(props.name)}`
)

function rowSummary(row) {
  return rowConformity(row)
}

function rowInitials(row) {
  const s = row.nombre_empleado || row.codigo_empleado || '?'
  return s
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function conformidadClass(v) {
  if (v === 'Conforme') return 'badge-green'
  if (v === 'No Conforme') return 'badge-red'
  return 'badge-gray'
}

function estadoClass(s) {
  if (s === 'Activo') return 'badge-green'
  if (s === 'Vacaciones') return 'badge-yellow'
  if (s === 'Suspendido') return 'badge-red'
  return 'badge-gray'
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
