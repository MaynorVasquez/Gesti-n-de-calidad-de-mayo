import { computed } from 'vue'

let keyCounter = 0

// Filas editables de una tabla hija: keys estables para v-for (evita que
// componentes con estado como SignaturePad/EmployeePicker se re-asocien a la
// fila equivocada al insertar/quitar), y detección de duplicados por campo.
export function useEditableRows(rowsRef, { makeRow, uniqueBy = null, prepend = true }) {
  function addRow(...args) {
    const row = { _key: ++keyCounter, ...makeRow(...args) }
    if (prepend) rowsRef.value.unshift(row)
    else rowsRef.value.push(row)
    return row
  }

  function removeRow(i) {
    rowsRef.value.splice(i, 1)
  }

  const duplicateValues = computed(() => {
    if (!uniqueBy) return new Set()
    const counts = {}
    for (const row of rowsRef.value) {
      const v = row[uniqueBy]
      if (v) counts[v] = (counts[v] || 0) + 1
    }
    return new Set(
      Object.entries(counts)
        .filter(([, n]) => n > 1)
        .map(([v]) => v)
    )
  })

  function isDuplicate(row) {
    return uniqueBy ? duplicateValues.value.has(row[uniqueBy]) : false
  }

  // Opciones disponibles para la fila `currentIndex`: excluye las ya elegidas
  // en otras filas. `options` es la lista completa; `optionKey` su campo id.
  function availableFor(currentIndex, options, optionKey = 'name') {
    const selectedElsewhere = new Set()
    rowsRef.value.forEach((row, i) => {
      if (i !== currentIndex && row[uniqueBy]) {
        selectedElsewhere.add(row[uniqueBy])
      }
    })
    return (options || []).filter((o) => !selectedElsewhere.has(o[optionKey]))
  }

  // Copia de las filas sin la key interna, lista para insertar en Frappe
  function serializeRows() {
    return rowsRef.value.map(({ _key, ...row }) => row)
  }

  return {
    addRow,
    removeRow,
    duplicateValues,
    isDuplicate,
    availableFor,
    serializeRows,
  }
}
