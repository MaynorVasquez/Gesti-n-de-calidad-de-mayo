<template>
  <div>
    <PageHeader
      :title="doc.doc?.name || name"
      :subtitle="subtitle"
      :back="'/atp'"
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

    <LoadingCard v-if="doc.loading && !doc.doc" class="m-6 lg:mx-10" />

    <div
      v-else-if="doc.error"
      class="px-4 sm:px-6 lg:px-10 py-12 text-center"
    >
      <div class="text-red-600 text-sm mb-3">
        {{ doc.error?.messages?.[0] || doc.error?.message || 'No se pudo cargar el documento.' }}
      </div>
      <router-link to="/atp" class="btn-secondary">Volver a la lista</router-link>
    </div>

    <div
      v-else-if="doc.doc"
      class="px-4 sm:px-6 lg:px-10 py-6 max-w-5xl space-y-5"
    >
      <DocMetaLine :doc="doc.doc" />

      <ErrorBanner :message="actionError" />

      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Información general</h3>
        <div class="grid sm:grid-cols-3 gap-4">
          <div>
            <div class="field-label">Folio</div>
            <div class="text-sm font-mono text-gray-900">{{ doc.doc.name }}</div>
          </div>
          <div>
            <div class="field-label">Fecha</div>
            <div class="text-sm text-gray-900">{{ formatDate(doc.doc.fecha_inspeccion) }}</div>
          </div>
          <div>
            <div class="field-label">Hora</div>
            <div class="text-sm text-gray-900">{{ formatTime(doc.doc.hora_inspeccion) }}</div>
          </div>
          <div>
            <div class="field-label">Supervisor</div>
            <div class="text-sm text-gray-900">{{ doc.doc.supervisor || '—' }}</div>
          </div>
        </div>
      </section>

      <section class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Detalle por empleado</h3>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ rows.length }} {{ rows.length === 1 ? 'muestra' : 'muestras' }} ·
              <span class="text-green-700 font-medium">
                {{ summary.conformes }} conformes
              </span>
              <template v-if="summary.noConformes > 0">
                ·
                <span class="text-red-700 font-medium">
                  {{ summary.noConformes }} no conformes
                </span>
              </template>
            </p>
          </div>
          <div v-if="rows.length" class="text-right">
            <div class="text-[11px] text-gray-500 uppercase tracking-wider">
              Cumplimiento
            </div>
            <div class="text-lg font-semibold text-gray-900">
              {{ summary.percent }}%
            </div>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="thead-row">
                <th class="th">Empleado</th>
                <th class="th">Área</th>
                <th class="th">Resultado</th>
                <th class="th">Cumplimiento</th>
                <th class="th">Acciones correctivas</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.name"
                class="border-t border-gray-100 align-top"
              >
                <td class="px-4 py-2.5">
                  <div class="text-gray-900">
                    {{ row.nombre_empleado || row.codigo_empleado }}
                  </div>
                  <div class="text-xs text-gray-500 font-mono">
                    {{ row.codigo_empleado }}
                  </div>
                </td>
                <td class="px-4 py-2.5 text-gray-700">{{ row.area || '—' }}</td>
                <td class="px-4 py-2.5 text-gray-900 font-medium">
                  {{ row.atp_resultado ?? '—' }}
                </td>
                <td class="px-4 py-2.5">
                  <span class="badge" :class="conformidadClass(row.cumplimiento)">
                    {{ row.cumplimiento || '—' }}
                  </span>
                </td>
                <td class="px-4 py-2.5 text-gray-600 text-xs max-w-md">
                  <div v-if="row.acciones_correctivas" class="whitespace-pre-wrap">{{ row.acciones_correctivas }}</div>
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
              <tr v-if="!rows.length">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-500">
                  Sin detalle registrado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">Firmas</h3>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <div class="field-label">Supervisor de Calidad</div>
            <div
              v-if="doc.doc.supervisor_firma"
              class="border border-gray-200 rounded-md bg-white p-3 flex items-center justify-center"
            >
              <img
                :src="doc.doc.supervisor_firma"
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

      <DeskEditNote :href="docUrl" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { atpResources } from '@/data/atp'
import { useDocActions } from '@/composables/docActions'
import { formatDate, formatTime } from '@/utils/format'
import { conformidadClass, deskUrl } from '@/utils/docstatus'
import PageHeader from '@/components/PageHeader.vue'
import LoadingCard from '@/components/LoadingCard.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import DocMetaLine from '@/components/DocMetaLine.vue'
import DeskEditNote from '@/components/DeskEditNote.vue'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import IconLoader from '~icons/lucide/loader-circle'
import IconExternalLink from '~icons/lucide/external-link'

const props = defineProps({
  name: { type: String, required: true },
})

const { doc, submitter, canceler, actionError, onSubmit, onCancel } =
  useDocActions({
    resources: atpResources,
    name: props.name,
    entity: { articulo: 'la inspección', enviadaLabel: 'enviada' },
  })

const rows = computed(() => doc.doc?.atp_detalle || [])

const subtitle = computed(() => {
  if (!doc.doc) return 'Cargando…'
  const f = formatDate(doc.doc.fecha_inspeccion)
  const h = formatTime(doc.doc.hora_inspeccion)
  return `Inspección del ${f} a las ${h}`
})

const summary = computed(() => {
  const total = rows.value.length
  const conformes = rows.value.filter((r) => r.cumplimiento === 'Conforme').length
  const noConformes = rows.value.filter((r) => r.cumplimiento === 'No Conforme').length
  const percent = total ? Math.round((conformes / total) * 100) : 0
  return { conformes, noConformes, percent }
})

const docUrl = computed(() => deskUrl('qc-lavado-de-manos-atp', props.name))
</script>
