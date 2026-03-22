import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import configContent from '@/data/example.json'

export const useNotebookStore = defineStore('notebook', () => {
  // 基础状态
  const isExpanded = ref(false)
  const allowDrag = ref(true)
  const textContent = ref(configContent.text)

  // 坐标与尺寸
  const pos = ref({ right: 40, top: 40 })
  const size = ref({ width: 275, height: 400 })

  // 动作 (Actions)
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
    isExpanded, allowDrag, textContent,
    pos, size,
    toggleExpand, setAllowDrag, updatePos, updateSize, clearContent, 
  }
}, {
  persist: true // 开启持久化，自动保存笔记位置和内容
})