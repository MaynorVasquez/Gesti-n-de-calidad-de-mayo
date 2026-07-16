import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Envío de un formulario "Nuevo": estado saving/error + submit con redirect.
// `validate()` devuelve un string de error para bloquear, o nada para seguir.
// `buildDoc()` arma el doc a insertar (permite serializar filas hijas).
export function useCreateForm({ create, redirect, validate, buildDoc }) {
  const router = useRouter()
  const saving = ref(false)
  const error = ref('')

  async function onSubmit() {
    const msg = validate?.()
    if (msg) {
      error.value = msg
      return
    }
    error.value = ''
    saving.value = true
    try {
      const doc = await create.submit(buildDoc())
      router.push(typeof redirect === 'function' ? redirect(doc) : redirect)
    } catch (e) {
      error.value = e.messages?.[0] || e.message || 'Error al guardar.'
    } finally {
      saving.value = false
    }
  }

  return { saving, error, onSubmit }
}
