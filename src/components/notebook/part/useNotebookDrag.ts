import { ref } from 'vue'
import { useNotebookStore } from '@/stores/notebook'

export function useNotebookDrag() {
  const store = useNotebookStore()
  let startX = 0
  let startY = 0
  let distance = 0
  const isClicking = ref(false)

  const handlePointerDown = (e: PointerEvent) => {
    if (store.isExpanded && !store.allowDrag) return

    const mouseMoving = (moveEvent: PointerEvent) => {
      const dx = Math.abs(moveEvent.clientX - (startX - store.pos.right))
      const dy = Math.abs(moveEvent.clientY + (startY + store.pos.top))
      distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 5) {
        store.updatePos({
          right: startX - moveEvent.clientX,
          top: moveEvent.clientY - startY,
        })
      } else {
        isClicking.value = true
      }
    }

    const handlePointerUp = () => {
      if ((isClicking.value || distance === 0) && !store.isExpanded) {
        store.toggleExpand(true)
      }
      isClicking.value = false
      window.removeEventListener('pointermove', mouseMoving)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    distance = 0
    startX = e.clientX + store.pos.right
    startY = e.clientY - store.pos.top
    window.addEventListener('pointermove', mouseMoving)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return { handlePointerDown }
}
