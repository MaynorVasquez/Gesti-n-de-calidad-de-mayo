<template>
  <div>
    <PageHeader
      title="Nueva inspección de personal"
      subtitle="Control BPM al personal de planta"
      :back="'/personal'"
    >
      <template #actions>
        <router-link to="/personal" class="btn-secondary">Cancelar</router-link>
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
      class="px-6 lg:px-10 py-6 max-w-5xl space-y-5"
    >
      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">
          Información general
        </h3>
        <div class="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <label class="field-label">Fecha</label>
            <input
              type="date"
              v-model="form.fecha_inspeccion"
              required
              class="input"
            />
          </div>
          <div>
            <label class="field-label">Hora</label>
            <input
              type="time"
              v-model="form.hora_inspeccion"
              required
              class="input"
            />
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">
            Empleados inspeccionados ({{ form.table_nnkn.length }})
          </h3>
          <button type="button" @click="addRow" class="btn-secondary">
            <IconPlus class="w-4 h-4" />
            Agregar empleado
          </button>
        </div>

        <div
          v-if="!form.table_nnkn.length"
          class="card p-10 text-center text-sm text-gray-500"
        >
          <IconUsers class="w-6 h-6 mx-auto text-gray-300 mb-2" />
          Agregá empleados para empezar a registrar la inspección.
        </div>

        <div
          v-for="(row, i) in form.table_nnkn"
          :key="i"
          class="card overflow-hidden"
        >
          <div
            class="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/40"
          >
            <div
              class="w-7 h-7 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold flex items-center justify-center shrink-0"
            >
              {{ i + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <select
                v-model="row.codigo_empleado"
                required
                class="select w-full text-sm"
                :class="{
                  '!border-red-300 !ring-red-200 focus:!ring-red-300':
                    isDuplicate(row),
                }"
                @change="onEmployeeChange(row)"
              >
                <option value="">Seleccionar empleado…</option>
                <option
                  v-for="emp in availableEmployeesFor(i)"
                  :key="emp.name"
                  :value="emp.name"
                >
                  {{ emp.employee_name }} ({{ emp.name }})
                </option>
              </select>
            </div>
            <select v-model="row.estado" class="select w-32 text-sm">
              <option value="Activo">Activo</option>
              <option value="Vacaciones">Vacaciones</option>
              <option value="Suspendido">Suspendido</option>
            </select>
            <span
              v-if="isDuplicate(row)"
              class="badge badge-red"
              title="Este empleado ya fue agregado en otra fila"
            >
              <IconAlert class="w-3 h-3" />
              Duplicado
            </span>
            <span
              v-else-if="rowSummary(row).noConformes > 0"
              class="badge badge-red"
              :title="`${rowSummary(row).noConformes} no conforme(s)`"
            >
              {{ rowSummary(row).noConformes }} NC
            </span>
            <button
              type="button"
              @click="removeRow(i)"
              class="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition shrink-0"
              title="Quitar empleado"
            >
              <IconTrash class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5">
            <div class="grid sm:grid-cols-2 gap-x-6">
              <div
                v-for="c in CRITERIA"
                :key="c.key"
                class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 sm:[&:nth-last-child(2)]:border-0"
              >
                <span class="text-sm text-gray-700">{{ c.label }}</span>
                <ConformidadToggle v-model="row[c.key]" />
              </div>
            </div>
          </div>

          <div class="px-5 pb-5">
            <label class="field-label">Observaciones y acciones correctivas</label>
            <textarea
              v-model="row.oac"
              rows="2"
              class="input"
              placeholder="Opcional"
            />
          </div>
        </div>
      </section>

      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-1">Firmas</h3>
        <p class="text-xs text-gray-500 mb-4">
          Firmá con el dedo en pantalla táctil o con el ratón. Es opcional al
          guardar como borrador.
        </p>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="field-label">Firma del Supervisor de Calidad</label>
            <SignaturePad
              v-model="form.supervidor_firma"
              label="Supervisor de Calidad"
            />
          </div>
          <div>
            <label class="field-label">Firma del Coordinador de Calidad</label>
            <SignaturePad
              v-model="form.coordinador_firma"
              label="Coordinador de Calidad"
            />
          </div>
        </div>
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
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createIPDoc,
  useEmployees,
  PERSONAL_CRITERIA as CRITERIA,
  newPersonalRow,
  rowConformity,
} from '@/data/personal'
import PageHeader from '@/components/PageHeader.vue'
import SignaturePad from '@/components/SignaturePad.vue'
import ConformidadToggle from '@/components/ConformidadToggle.vue'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash-2'
import IconCheck from '~icons/lucide/check'
import IconLoader from '~icons/lucide/loader-circle'
import IconAlert from '~icons/lucide/alert-circle'
import IconUsers from '~icons/lucide/users'

const router = useRouter()
const employees = useEmployees()

const now = new Date()
const yyyy = now.getFullYear()
const mm = String(now.getMonth() + 1).padStart(2, '0')
const dd = String(now.getDate()).padStart(2, '0')
const hh = String(now.getHours()).padStart(2, '0')
const mi = String(now.getMinutes()).padStart(2, '0')

const form = reactive({
  doctype: 'QC Inspeccion de Personal',
  fecha_inspeccion: `${yyyy}-${mm}-${dd}`,
  hora_inspeccion: `${hh}:${mi}:00`,
  supervidor_firma: '',
  coordinador_firma: '',
  table_nnkn: [],
})

const saving = ref(false)
const error = ref('')

function addRow() {
  form.table_nnkn.push(newPersonalRow())
}

function removeRow(i) {
  form.table_nnkn.splice(i, 1)
}

function onEmployeeChange(row) {
  const emp = (employees.data || []).find((e) => e.name === row.codigo_empleado)
  row.nombre_empleado = emp?.employee_name || ''
}

function rowSummary(row) {
  return rowConformity(row)
}

const duplicateCodes = computed(() => {
  const counts = {}
  for (const row of form.table_nnkn) {
    if (row.codigo_empleado) {
      counts[row.codigo_empleado] = (counts[row.codigo_empleado] || 0) + 1
    }
  }
  return new Set(
    Object.entries(counts)
      .filter(([, n]) => n > 1)
      .map(([code]) => code)
  )
})

function isDuplicate(row) {
  return duplicateCodes.value.has(row.codigo_empleado)
}

function availableEmployeesFor(currentIndex) {
  const selectedElsewhere = new Set()
  form.table_nnkn.forEach((row, i) => {
    if (i !== currentIndex && row.codigo_empleado) {
      selectedElsewhere.add(row.codigo_empleado)
    }
  })
  return (employees.data || []).filter(
    (emp) => !selectedElsewhere.has(emp.name)
  )
}

const create = createIPDoc()

async function onSubmit() {
  if (!form.table_nnkn.length) {
    error.value = 'Agregá al menos un empleado para inspeccionar.'
    return
  }
  for (const row of form.table_nnkn) {
    if (!row.codigo_empleado) {
      error.value = 'Selecciona un empleado en todas las filas.'
      return
    }
  }
  if (duplicateCodes.value.size > 0) {
    error.value =
      'Hay empleados repetidos en la inspección. Cada empleado solo puede aparecer una vez.'
    return
  }
  error.value = ''
  saving.value = true
  try {
    await create.submit(form)
    router.push('/personal')
  } catch (e) {
    error.value = e.messages?.[0] || e.message || 'Error al guardar.'
  } finally {
    saving.value = false
  }
}

addRow()
</script>
