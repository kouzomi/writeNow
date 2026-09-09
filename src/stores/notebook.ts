import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotebookStore = defineStore(
  'notebook',
  () => {
    const isExpanded = ref(false)
    const isAnimating = ref(true)
    const allowDrag = ref(true)
    const textContent = ref('')

    const pos = ref({ right: 40, top: 40 })
    const size = ref({ width: 275, height: 400 })

    const toggleExpand = (state?: boolean) => {
      isExpanded.value = state ?? !isExpanded.value
    }

    const setAllowDrag = (value: boolean) => {
      allowDrag.value = value
    }

    const updatePos = (newPos: { right: number; top: number }) => {
      pos.value = { ...newPos }
    }

    const updateSize = (newSize: { width: number; height: number }) => {
      size.value = { ...newSize }
    }

    const clearContent = () => {
      textContent.value = ''
    }

    return {
      isExpanded,
      allowDrag,
      textContent,
      isAnimating,
      pos,
      size,
      toggleExpand,
      setAllowDrag,
      updatePos,
      updateSize,
      clearContent,
    }
  },
  {
    persist: true,
  },
)
