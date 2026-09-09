<script setup lang="ts">
import { computed } from 'vue'
import { useNotebookStore } from '@/stores/notebook'
import { useNotebookDrag } from './useNotebookDrag'

const store = useNotebookStore()
const { handlePointerDown } = useNotebookDrag()
const movableTip = computed(() => (store.allowDrag ? '已解锁' : '已固定'))

const handleToggleDrag = () => {
  store.setAllowDrag(!store.allowDrag)
}

const handleToggleClose = () => {
  store.toggleExpand(false)
}
</script>

<template>
  <div
    class="navigation"
    :class="{ movable: store.allowDrag }"
    @pointerdown="handlePointerDown"
  >
    <button @pointerdown.stop @click="handleToggleClose">关闭</button>
    <button @pointerdown.stop @click="store.clearContent">清空</button>
    <button @pointerdown.stop @click="handleToggleDrag">{{ movableTip }}</button>
  </div>
</template>

<style scoped>
button {
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  overflow: hidden;
  flex-shrink: 0;
}
.navigation {
  position: relative;
  z-index: 100;
  display: flex;
  height: 50px;
  flex-direction: row-reverse;
  align-items: center;
  gap: 10px;
  border-bottom: solid 1px var(--border-soft);
  padding: 0 12px;
  background: var(--bg-chrome);
  flex-shrink: 0;
  touch-action: none;
  user-select: none;
  cursor: pointer;
}
.navigation.movable {
  cursor: pointer;
}
</style>
