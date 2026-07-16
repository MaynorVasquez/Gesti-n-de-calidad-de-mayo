<template>
  <div>
    <PageHeader
      :title="doc.doc?.name || name"
      :subtitle="subtitle"
      :back="'/paros'"
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
      <router-link to="/paros" class="btn-secondary">
        Volver a la lista
      </router-link>
    </div>

    <div
      v-else-if="doc.doc"
      class="px-4 sm:px-6 lg:px-10 py-6 max-w-3xl space-y-5"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <span class="badge" :class="docstatusClass(doc.doc.docstatus)">
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="dotClass(doc.doc.docstatus)"
          />
          {{ docstatusLabel(doc.doc.docstatus) }}
        </span>
        <span
          v-if="!editable"
          class="badge"
          :class="paroStatusClass(doc.doc.status)"
        >
          {{ paroStatusLabel(doc.doc.status) }}
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
          class="text-sm text-gray-700 prose prose-sm max-w-none"
          v-html="doc.doc.comentarios"
        />
        <div v-else class="text-sm text-gray-400">Sin comentarios.</div>
      </section>

      <p v-if="!editable" class="text-xs text-gray-500">
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
  useParoDoc,
  saveParoDoc,
  submitParoDoc,
  cancelParoDoc,
  PARO_STATUSES,
  paroStatusClass,
  paroStatusLabel,
} from '@/data/paros'
import { useConfirm } from '@/composables/confirm'
import PageHeader from '@/components/PageHeader.vue'
import IconCheck from '~icons/lucide/check'
import IconX from '~icons/lucide/x'
import IconLoader from '~icons/lucide/loader-circle'
import IconExternalLink from '~icons/lucide/external-link'
import IconSave from '~icons/lucide/save'

const props = defineProps({
  name: { type: String, required: true },
})

const doc = useParoDoc(props.name)
const saver = saveParoDoc()
const submitter = submitParoDoc()
const canceler = cancelParoDoc()
const confirm = useConfirm()

const editable = computed(() => doc.doc?.docstatus === 0)

const subtitle = computed(() => {
  if (!doc.doc) return 'Cargando…'
  const producto = doc.doc.itemname || doc.doc.qc_producto || 'Paro de producción'
  return `${producto} · ${formatDate(doc.doc.docdate)} ${formatTime(doc.doc.hora)}`
})

const deskUrl = computed(
  () => `/app/qc-paros-de-produccion/${encodeURIComponent(props.name)}`
)

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

async function onSave() {
  try {
    await saver.submit(doc.doc)
    await doc.reload()
  } catch (e) {
    alert(e.messages?.[0] || e.message || 'Error al guardar.')
  }
}

async function onSubmit() {
  const ok = await confirm({
    title: '¿Enviar el paro de producción?',
    message:
      'Una vez enviado, el documento queda firme y no podrá modificarse después.',
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
    title: '¿Cancelar el paro de producción?',
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
