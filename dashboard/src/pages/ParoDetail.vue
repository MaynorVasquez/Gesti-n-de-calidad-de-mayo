<template>
  <div>
    <PageHeader
      :title="doc.doc?.name || name"
      :subtitle="subtitle"
      :back="'/paros'"
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
      <router-link to="/paros" class="btn-secondary">
        Volver a la lista
      </router-link>
    </div>

    <div
      v-else-if="doc.doc"
      class="px-4 sm:px-6 lg:px-10 py-6 max-w-3xl space-y-5"
    >
      <DocMetaLine :doc="doc.doc">
        <span
          v-if="!editable"
          class="badge"
          :class="paroStatusClass(doc.doc.status)"
        >
          {{ paroStatusLabel(doc.doc.status) }}
        </span>
      </DocMetaLine>

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
              {{ doc.doc.qc_producto || '—' }}
            </a>
          </div>
          <div>
            <div class="field-label">Producto</div>
            <div class="text-sm text-gray-900">{{ doc.doc.itemname || '—' }}</div>
          </div>
          <div>
            <div class="field-label">Código</div>
            <div class="text-sm font-mono text-gray-900">
              {{ doc.doc.itemcode || '—' }}
            </div>
          </div>
          <div>
            <div class="field-label">Fecha</div>
            <div class="text-sm text-gray-900">{{ formatDate(doc.doc.docdate) }}</div>
          </div>
          <div>
            <div class="field-label">Hora</div>
            <div class="text-sm text-gray-900">{{ formatTime(doc.doc.hora) }}</div>
          </div>
          <div>
            <div class="field-label">Status</div>
            <select
              v-if="editable"
              v-model="doc.doc.status"
              class="select w-full"
            >
              <option v-for="s in PARO_STATUSES" :key="s" :value="s">
                {{ paroStatusLabel(s) }}
              </option>
            </select>
            <span
              v-else
              class="badge"
              :class="paroStatusClass(doc.doc.status)"
            >
              {{ paroStatusLabel(doc.doc.status) }}
            </span>
          </div>
        </div>
      </section>

      <section v-if="editable" class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-2">
          Motivo del paro / comentarios
        </h3>
        <textarea
          v-model="doc.doc.comentarios"
          rows="5"
          class="input"
          placeholder="Describe el motivo del paro de producción…"
        />
      </section>
      <section v-else class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-2">
          Motivo del paro / comentarios
        </h3>
        <div
          v-if="doc.doc.comentarios"
          class="text-sm text-gray-700 whitespace-pre-wrap"
        >{{ doc.doc.comentarios }}</div>
        <div v-else class="text-sm text-gray-400">Sin comentarios.</div>
      </section>

      <DeskEditNote v-if="!editable" :href="docUrl" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  paroResources,
  PARO_STATUSES,
  paroStatusClass,
  paroStatusLabel,
} from '@/data/paros'
import { useDocActions } from '@/composables/docActions'
import { formatDate, formatTime } from '@/utils/format'
import { deskUrl } from '@/utils/docstatus'
import PageHeader from '@/components/PageHeader.vue'
import LoadingCard from '@/components/LoadingCard.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import DocMetaLine from '@/components/DocMetaLine.vue'
import DeskEditNote from '@/components/DeskEditNote.vue'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import IconLoader from '~icons/lucide/loader-circle'
import IconExternalLink from '~icons/lucide/external-link'
import IconSave from '~icons/lucide/save'

const props = defineProps({
  name: { type: String, required: true },
})

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
  resources: paroResources,
  name: props.name,
  entity: { articulo: 'el paro de producción', enviadaLabel: 'enviado' },
})

const subtitle = computed(() => {
  if (!doc.doc) return 'Cargando…'
  const producto = doc.doc.itemname || doc.doc.qc_producto || 'Paro de producción'
  return `${producto} · ${formatDate(doc.doc.docdate)} ${formatTime(doc.doc.hora)}`
})

const docUrl = computed(() => deskUrl('qc-paros-de-produccion', props.name))
</script>
