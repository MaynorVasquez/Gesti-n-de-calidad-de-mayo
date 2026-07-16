import { computed, ref } from 'vue'
import { useConfirm } from './confirm'

// Acciones de un documento en Detail (guardar/enviar/cancelar) con diálogo de
// confirmación y errores en un ref (para mostrar en banner, no alert()).
// `entity` personaliza los textos: { articulo: 'la inspección' | 'el paro de producción',
// enviadaLabel: 'enviada'|'enviado', submitMessage: <texto completo del diálogo de envío> }
// `before` se ejecuta antes de guardar/enviar (p.ej. derivar conformidad).
export function useDocActions({ resources, name, entity = {}, before }) {
  const articulo = entity.articulo || 'el documento'
  const enviada = entity.enviadaLabel || 'enviado'
  const submitMessage =
    entity.submitMessage ||
    `Una vez ${enviada}, el documento queda firme y no podrá modificarse después.`

  const doc = resources.useDoc(name)
  const saver = resources.save()
  const submitter = resources.submit()
  const canceler = resources.cancel()
  const confirm = useConfirm()

  const actionError = ref('')

  const editable = computed(() => doc.doc?.docstatus === 0)

  async function onSave() {
    actionError.value = ''
    before?.()
    try {
      await saver.submit(doc.doc)
      await doc.reload()
    } catch (e) {
      actionError.value = e.messages?.[0] || e.message || 'Error al guardar.'
    }
  }

  async function onSubmit() {
    const ok = await confirm({
      title: `¿Enviar ${articulo}?`,
      message: submitMessage,
      confirmText: 'Enviar',
      cancelText: 'Volver',
      variant: 'primary',
    })
    if (!ok) return
    actionError.value = ''
    before?.()
    try {
      await submitter.submit(doc.doc)
      await doc.reload()
    } catch (e) {
      actionError.value = e.messages?.[0] || e.message || 'Error al enviar.'
    }
  }

  async function onCancel() {
    const ok = await confirm({
      title: `¿Cancelar ${articulo}?`,
      message:
        'Esta acción no se puede deshacer. El documento quedará marcado como cancelado.',
      confirmText: 'Sí, cancelar',
      cancelText: 'Volver',
      variant: 'danger',
    })
    if (!ok) return
    actionError.value = ''
    try {
      await canceler.submit({
        doctype: doc.doc.doctype,
        name: doc.doc.name,
      })
      await doc.reload()
    } catch (e) {
      actionError.value = e.messages?.[0] || e.message || 'Error al cancelar.'
    }
  }

  return {
    doc,
    saver,
    submitter,
    canceler,
    editable,
    actionError,
    onSave,
    onSubmit,
    onCancel,
  }
}
