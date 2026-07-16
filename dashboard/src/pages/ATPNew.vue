<template>
  <div>
    <PageHeader
      title="Nueva inspección ATP"
      subtitle="Registro de lavado de manos y resultados ATP"
      :back="'/atp'"
    >
      <template #actions>
        <router-link to="/atp" class="btn-secondary">Cancelar</router-link>
        <button
          type="submit"
          form="atp-new-form"
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
      id="atp-new-form"
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

      <section class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">
              Detalle por empleado
            </h3>
            <p class="text-xs text-gray-500 mt-0.5">
              Agrega una fila por cada empleado muestreado.
            </p>
          </div>
          <button type="button" @click="addRow" class="btn-secondary">
            <IconPlus class="w-4 h-4" />
            Agregar fila
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="thead-row">
                <th class="th">Empleado</th>
                <th class="th">Área</th>
                <th class="th w-28">Resultado</th>
                <th class="th w-36">Cumplimiento</th>
                <th class="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in form.atp_detalle"
                :key="row._key"
                class="border-t border-gray-100"
              >
                <td class="px-3 py-2">
                  <EmployeePicker
                    v-model="row.codigo_empleado"
                    :employees="availableFor(i, employees.data)"
                    :invalid="isDuplicate(row)"
                    required
                    placeholder="Buscar por nombre o código…"
                    @change="(emp) => onEmployeeChange(row, emp)"
                  />
                  <div
                    v-if="isDuplicate(row)"
                    class="text-[11px] text-red-600 mt-1 flex items-center gap-1"
                  >
                    <IconAlert class="w-3 h-3" />
                    Empleado duplicado
                  </div>
                </td>
                <td class="px-3 py-2">
                  <select v-model="row.area" class="select">
                    <option value="">—</option>
                    <option
                      v-for="a in areas.data || []"
                      :key="a.name"
                      :value="a.name"
                    >
                      {{ a.name }}
                    </option>
                  </select>
                </td>
                <td class="px-3 py-2">
                  <input
                    type="number"
                    v-model.number="row.atp_resultado"
                    class="input"
                    placeholder="0"
                  />
                </td>
                <td class="px-3 py-2">
                  <select v-model="row.cumplimiento" class="select">
                    <option value="Conforme">Conforme</option>
                    <option value="No Conforme">No Conforme</option>
                  </select>
                </td>
                <td class="px-3 py-2 text-right">
                  <button
                    type="button"
                    @click="removeRow(i)"
                    class="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition"
                    title="Quitar fila"
                  >
                    <IconTrash class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="!form.atp_detalle.length">
                <td colspan="5" class="px-4 py-10 text-center text-sm text-gray-500">
                  Agrega al menos una fila para registrar muestras.
                </td>
              </tr>
            </tbody>
          </table>
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
            <label class="field-label">Firma del Supervisor</label>
            <SignaturePad
              v-model="form.supervisor_firma"
              label="Supervisor de Calidad"
            />
          </div>
          <div>
            <label class="field-label">Firma del Coordinador</label>
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
import { createATPDoc, useEmployees, useAreas, ATP_DOCTYPE } from '@/data/atp'
import { useEditableRows } from '@/composables/editableRows'
import { useCreateForm } from '@/composables/createForm'
import { nowDefaults } from '@/utils/format'
import PageHeader from '@/components/PageHeader.vue'
import SignaturePad from '@/components/SignaturePad.vue'
import EmployeePicker from '@/components/EmployeePicker.vue'
import ErrorBanner from '@/components/ErrorBanner.vue'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash-2'
import IconCheck from '~icons/lucide/check'
import IconLoader from '~icons/lucide/loader-circle'
import IconAlert from '~icons/lucide/alert-circle'

const employees = useEmployees()
const areas = useAreas()
const now = nowDefaults()

const form = reactive({
  doctype: ATP_DOCTYPE,
  fecha_inspeccion: now.date,
  hora_inspeccion: now.time,
  supervisor_firma: '',
  coordinador_firma: '',
  atp_detalle: [],
})

const {
  addRow,
  removeRow,
  duplicateValues,
  isDuplicate,
  availableFor,
  serializeRows,
} = useEditableRows(toRef(form, 'atp_detalle'), {
  uniqueBy: 'codigo_empleado',
  makeRow: () => ({
    codigo_empleado: '',
    nombre_empleado: '',
    area: '',
    atp_resultado: null,
    cumplimiento: 'Conforme',
    acciones_correctivas: '',
  }),
})

function onEmployeeChange(row, emp) {
  row.nombre_empleado = emp?.employee_name || ''
}

const create = createATPDoc()

const { saving, error, onSubmit } = useCreateForm({
  create,
  redirect: '/atp',
  validate() {
    if (!form.atp_detalle.length) return 'Agrega al menos un empleado.'
    for (const row of form.atp_detalle) {
      if (!row.codigo_empleado)
        return 'Selecciona un empleado en todas las filas.'
    }
    if (duplicateValues.value.size > 0)
      return 'Hay empleados repetidos en la inspección. Cada empleado solo puede aparecer una vez.'
  },
  buildDoc: () => ({ ...form, atp_detalle: serializeRows() }),
})

addRow()
</script>
