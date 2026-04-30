<template>
  <div>
    <PageHeader
      title="Nueva inspección de Orden y Limpieza"
      subtitle="Auditoría por área de planta"
      :back="'/limpieza'"
    >
      <template #actions>
        <router-link to="/limpieza" class="btn-secondary">Cancelar</router-link>
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
      <section class="card p-5 flex items-end gap-6 flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <label class="field-label">Fecha</label>
          <input
            type="date"
            v-model="form.fecha_inspeccion"
            required
            class="input"
          />
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="field-label">Hora</label>
          <input
            type="time"
            v-model="form.hora_inspeccion"
            required
            class="input"
          />
        </div>
        <div class="text-right ml-auto">
          <div class="text-[11px] text-gray-500 uppercase tracking-wider">
            Cumplimiento total
          </div>
          <div class="text-2xl font-semibold tabular-nums" :class="totalColor">
            {{ totalScore.toFixed(1) }}%
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">
            Áreas inspeccionadas ({{ form.listado_areas.length }})
          </h3>
          <button type="button" @click="addRow" class="btn-secondary">
            <IconPlus class="w-4 h-4" />
            Agregar área
          </button>
        </div>

        <div
          v-if="!form.listado_areas.length"
          class="card p-10 text-center text-sm text-gray-500"
        >
          <IconSparkles class="w-6 h-6 mx-auto text-gray-300 mb-2" />
          Agregá áreas para empezar a registrar la inspección.
        </div>

        <div
          v-for="(row, i) in form.listado_areas"
          :key="i"
          class="card overflow-hidden"
        >
          <div
            class="px-5 py-3 border-b border-gray-100 bg-gray-50/40 flex items-center gap-3 flex-wrap"
          >
            <div
              class="w-7 h-7 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold flex items-center justify-center shrink-0"
            >
              {{ i + 1 }}
            </div>
            <div class="flex-1 min-w-[200px]">
              <select
                v-model="row.area"
                required
                class="select w-full text-sm"
                :class="{
                  '!border-red-300 !ring-red-200 focus:!ring-red-300':
                    isDuplicate(row),
                }"
                @change="onAreaChange(row)"
              >
                <option value="">Seleccionar área…</option>
                <option
                  v-for="a in availableAreasFor(i)"
                  :key="a.name"
                  :value="a.name"
                >
                  {{ a.name }}
                </option>
              </select>
              <div
                v-if="isDuplicate(row)"
                class="text-[11px] text-red-600 mt-1 flex items-center gap-1"
              >
                <IconAlert class="w-3 h-3" />
                Área duplicada
              </div>
            </div>
            <span
              v-if="row.departamento"
              class="badge badge-gray"
              :title="row.departamento"
            >
              {{ row.departamento }}
            </span>
            <span
              class="font-semibold tabular-nums text-sm"
              :class="rowScoreColor(row)"
            >
              {{ rowAverage(row).toFixed(1) }}%
            </span>
            <button
              type="button"
              @click="removeRow(i)"
              class="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition shrink-0"
              title="Quitar área"
            >
              <IconTrash class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-1">
            <div
              v-for="c in CRITERIA"
              :key="c.key"
              class="grid grid-cols-12 gap-3 items-center py-2 border-b border-gray-50 last:border-0"
            >
              <span class="col-span-12 sm:col-span-5 text-sm text-gray-700">
                {{ c.label }}
              </span>
              <div class="col-span-7 sm:col-span-4">
                <ConformidadToggle
                  v-model="row[c.key]"
                  @update:modelValue="onConformidadChange(row, c, $event)"
                />
              </div>
              <div class="col-span-5 sm:col-span-3">
                <div
                  v-if="row[c.key] === 'No Conforme'"
                  class="flex items-center gap-1"
                >
                  <input
                    type="number"
                    v-model.number="row[c.resultKey]"
                    min="0"
                    max="100"
                    step="1"
                    class="input text-right tabular-nums"
                  />
                  <span class="text-xs text-gray-500">%</span>
                </div>
                <div v-else class="text-xs text-gray-400 text-right">100%</div>
              </div>
            </div>
          </div>

          <div class="px-5 pb-5 space-y-3">
            <div>
              <label class="field-label">Observaciones</label>
              <textarea
                v-model="row.observaciones"
                rows="2"
                class="input"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label class="field-label">Acciones correctivas</label>
              <textarea
                v-model="row.acciones_correctivas"
                rows="2"
                class="input"
                placeholder="Opcional"
              />
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="field-label">Nombre del responsable</label>
                <input
                  type="text"
                  v-model="row.nombre_responsable"
                  class="input"
                  placeholder="Persona responsable del área"
                />
              </div>
              <div>
                <label class="field-label">Fecha de cierre</label>
                <input
                  type="date"
                  v-model="row.fecha_cierre"
                  class="input"
                />
              </div>
            </div>
            <div>
              <label class="field-label">Firma del responsable</label>
              <SignaturePad
                v-model="row.firma_responsable"
                label="Responsable del área"
                :height="120"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="card p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-1">
          Firma del Supervisor de Calidad
        </h3>
        <p class="text-xs text-gray-500 mb-4">
          Firma el responsable del documento (opcional al guardar como
          borrador).
        </p>
        <SignaturePad
          v-model="form.firma_supervisor_calidad"
          label="Supervisor de Calidad"
        />
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
  createOLDoc,
  useAreasWithDept,
  LIMPIEZA_CRITERIA as CRITERIA,
  newLimpiezaRow,
  rowAverage,
  totalAverage,
} from '@/data/limpieza'
import PageHeader from '@/components/PageHeader.vue'
import SignaturePad from '@/components/SignaturePad.vue'
import ConformidadToggle from '@/components/ConformidadToggle.vue'
import IconPlus from '~icons/lucide/plus'
import IconTrash from '~icons/lucide/trash-2'
import IconCheck from '~icons/lucide/check'
import IconLoader from '~icons/lucide/loader-circle'
import IconAlert from '~icons/lucide/alert-circle'
import IconSparkles from '~icons/lucide/sparkles'

const router = useRouter()
const areas = useAreasWithDept()

const now = new Date()
const yyyy = now.getFullYear()
const mm = String(now.getMonth() + 1).padStart(2, '0')
const dd = String(now.getDate()).padStart(2, '0')
const hh = String(now.getHours()).padStart(2, '0')
const mi = String(now.getMinutes()).padStart(2, '0')

const form = reactive({
  doctype: 'QC Orden y Limpieza',
  fecha_inspeccion: `${yyyy}-${mm}-${dd}`,
  hora_inspeccion: `${hh}:${mi}:00`,
  firma_supervisor_calidad: '',
  listado_areas: [],
})

const saving = ref(false)
const error = ref('')

function addRow() {
  form.listado_areas.push(newLimpiezaRow())
}

function removeRow(i) {
  form.listado_areas.splice(i, 1)
}

function onAreaChange(row) {
  const a = (areas.data || []).find((x) => x.name === row.area)
  row.departamento = a?.departamento || ''
}

function onConformidadChange(row, criterion, value) {
  if (value === 'No Conforme' && (row[criterion.resultKey] === 100 || row[criterion.resultKey] == null)) {
    row[criterion.resultKey] = 100
  } else if (value !== 'No Conforme') {
    row[criterion.resultKey] = 100
  }
}

const totalScore = computed(() => totalAverage(form.listado_areas))

const totalColor = computed(() => {
  if (!form.listado_areas.length) return 'text-gray-400'
  const v = totalScore.value
  if (v >= 90) return 'text-green-700'
  if (v >= 70) return 'text-yellow-700'
  return 'text-red-700'
})

function rowScoreColor(row) {
  const v = rowAverage(row)
  if (v >= 90) return 'text-green-700'
  if (v >= 70) return 'text-yellow-700'
  return 'text-red-700'
}

const duplicateAreas = computed(() => {
  const counts = {}
  for (const row of form.listado_areas) {
    if (row.area) counts[row.area] = (counts[row.area] || 0) + 1
  }
  return new Set(
    Object.entries(counts)
      .filter(([, n]) => n > 1)
      .map(([name]) => name)
  )
})

function isDuplicate(row) {
  return duplicateAreas.value.has(row.area)
}

function availableAreasFor(currentIndex) {
  const selectedElsewhere = new Set()
  form.listado_areas.forEach((row, i) => {
    if (i !== currentIndex && row.area) selectedElsewhere.add(row.area)
  })
  return (areas.data || []).filter((a) => !selectedElsewhere.has(a.name))
}

const create = createOLDoc()

async function onSubmit() {
  if (!form.listado_areas.length) {
    error.value = 'Agregá al menos un área para inspeccionar.'
    return
  }
  for (const row of form.listado_areas) {
    if (!row.area) {
      error.value = 'Selecciona un área en todas las filas.'
      return
    }
  }
  if (duplicateAreas.value.size > 0) {
    error.value =
      'Hay áreas repetidas en la inspección. Cada área solo puede aparecer una vez.'
    return
  }
  error.value = ''
  saving.value = true
  try {
    await create.submit(form)
    router.push('/limpieza')
  } catch (e) {
    error.value = e.messages?.[0] || e.message || 'Error al guardar.'
  } finally {
    saving.value = false
  }
}

addRow()
</script>
