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
          type="submit"
          form="ip-new-form"
          class="btn-primary"
          :disabled="saving"
        >
          <IconLoader v-if="saving" class="w-4 h-4 animate-spin" />
          <IconCheck v-else class="w-4 h-4" />
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
      </template>
    </PageHeader>

    <form
      id="ip-new-form"
      @submit.prevent="onSubmit"
      class="px-4 sm:px-6 lg:px-10 py-6 max-w-5xl space-y-5"
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
          :key="row._key"
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
              <EmployeePicker
                v-model="row.codigo_empleado"
                :employees="availableFor(i, employees.data)"
                :invalid="isDuplicate(row)"
                required
                placeholder="Buscar empleado por nombre o código…"
                @change="(emp) => onEmployeeChange(row, emp)"
              />
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

      <ErrorBanner :message="error" />
    </form>
  </div>
</template>

<script setup>
import { reactive, toRef } from 'vue'
import {
  createIPDoc,
  useEmployees,
  PERSONAL_CRITERIA as CRITERIA,
  PERSONAL_DOCTYPE,
  newPersonalRow,
  rowConformity,
} from '@/data/personal'
import { useEditableRows } from '@/composables/editableRows'
import { useCreateForm } from '@/composables/createForm'
import { nowDefaults } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import SignaturePad from '@/components/SignaturePad.vue'
import ConformidadToggle from '@/components/ConformidadToggle.vue'
import EmployeePicker from '@/components/EmployeePicker.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash-2'
import IconCheck from '~icons/lucide/check'
import IconLoader from '~icons/lucide/loader-circle'
import IconAlert from '~icons/lucide/alert-circle'
import IconUsers from '~icons/lucide/users'

const employees = useEmployees()
const now = nowDefaults()

const form = reactive({
  doctype: PERSONAL_DOCTYPE,
  fecha_inspeccion: now.date,
  hora_inspeccion: now.time,
  supervidor_firma: '',
  coordinador_firma: '',
  table_nnkn: [],
})

const {
  addRow,
  removeRow,
  duplicateValues,
  isDuplicate,
  availableFor,
  serializeRows,
} = useEditableRows(toRef(form, 'table_nnkn'), {
  uniqueBy: 'codigo_empleado',
  makeRow: newPersonalRow,
})

function onEmployeeChange(row, emp) {
  row.nombre_empleado = emp?.employee_name || ''
}

function rowSummary(row) {
  return rowConformity(row)
}

const create = createIPDoc()

const { saving, error, onSubmit } = useCreateForm({
  create,
  redirect: '/personal',
  validate() {
    if (!form.table_nnkn.length)
      return 'Agregá al menos un empleado para inspeccionar.'
    for (const row of form.table_nnkn) {
      if (!row.codigo_empleado)
        return 'Selecciona un empleado en todas las filas.'
    }
    if (duplicateValues.value.size > 0)
      return 'Hay empleados repetidos en la inspección. Cada empleado solo puede aparecer una vez.'
  },
  buildDoc: () => ({ ...form, table_nnkn: serializeRows() }),
})

addRow()
</script>
