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

    <form @submit.prevent="onSubmit" class="px-4 sm:px-6 lg:px-10 py-6 max-w-5xl space-y-5">
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
              <tr class="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <th class="px-4 py-2.5 font-medium">Empleado</th>
                <th class="px-4 py-2.5 font-medium">Área</th>
                <th class="px-4 py-2.5 font-medium w-28">Resultado</th>
                <th class="px-4 py-2.5 font-medium w-36">Cumplimiento</th>
                <th class="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in form.atp_detalle"
                :key="i"
                class="border-t border-gray-100"
              >
                <td class="px-3 py-2">
                  <select
                    v-model="row.codigo_empleado"
                    required
                    class="select"
                    :class="{
                      '!border-red-300 !ring-red-200 focus:!ring-red-300':
                        isDuplicate(row),
                    }"
                  >
                    <option value="">Seleccionar…</option>
                    <option
                      v-for="emp in availableEmployeesFor(i)"
                      :key="emp.name"
                      :value="emp.name"
                    >
                      {{ emp.employee_name }} ({{ emp.name }})
                    </option>
                  </select>
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
import { createATPDoc, useEmployees, useAreas } from '@/data/atp'
import PageHeader from '@/components/PageHeader.vue'
import SignaturePad from '@/components/SignaturePad.vue'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash-2'
import IconCheck from '~icons/lucide/check'
import IconLoader from '~icons/lucide/loader-circle'
import IconAlert from '~icons/lucide/alert-circle'

const router = useRouter()
const employees = useEmployees()
const areas = useAreas()

const now = new Date()
const yyyy = now.getFullYear()
const mm = String(now.getMonth() + 1).padStart(2, '0')
const dd = String(now.getDate()).padStart(2, '0')
const hh = String(now.getHours()).padStart(2, '0')
const mi = String(now.getMinutes()).padStart(2, '0')

const form = reactive({
  doctype: 'QC Lavado de Manos ATP',
  fecha_inspeccion: `${yyyy}-${mm}-${dd}`,
  hora_inspeccion: `${hh}:${mi}:00`,
  supervisor_firma: '',
  coordinador_firma: '',
  atp_detalle: [],
})

const saving = ref(false)
const error = ref('')

function addRow() {
  form.atp_detalle.push({
    codigo_empleado: '',
    area: '',
    atp_resultado: null,
    cumplimiento: 'Conforme',
    acciones_correctivas: '',
  })
}

function removeRow(i) {
  form.atp_detalle.splice(i, 1)
}

const duplicateCodes = computed(() => {
  const counts = {}
  for (const row of form.atp_detalle) {
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
  form.atp_detalle.forEach((row, i) => {
    if (i !== currentIndex && row.codigo_empleado) {
      selectedElsewhere.add(row.codigo_empleado)
    }
  })
  return (employees.data || []).filter(
    (emp) => !selectedElsewhere.has(emp.name)
  )
}

const create = createATPDoc()

async function onSubmit() {
  if (!form.atp_detalle.length) {
    error.value = 'Agrega al menos un empleado.'
    return
  }
  for (const row of form.atp_detalle) {
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
    router.push('/atp')
  } catch (e) {
    error.value = e.message || 'Error al guardar.'
  } finally {
    saving.value = false
  }
}

addRow()
</script>
