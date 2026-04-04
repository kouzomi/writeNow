<script setup lang="ts">
import { ref } from 'vue'
import { useNotebookStore } from '@/stores/notebook'

const store = useNotebookStore()
let startX = 0, startY = 0, distance = 0

const isClicking = ref(false)

const handleMouseDown = (e: PointerEvent) => {
  const mouseMoving = (e: PointerEvent) => {
    const dx = Math.abs(e.clientX - (startX - store.pos.right))
    const dy = Math.abs(e.clientY + (startY + store.pos.top))
    distance = Math.sqrt(dx*dx + dy*dy)

    if (distance > 5) {
      store.updatePos({
        right: startX - e.clientX,
        top: e.clientY - startY
      })
    }
    else isClicking.value = true
  }
  const handleMouseUp = (e: PointerEvent) => {
    //console.log(pos.value)
    if (isClicking.value || distance == 0) {
      if(!store.isExpanded) {
        store.toggleExpand(true)
      }
    }
    isClicking.value = false
    window.removeEventListener('pointermove', mouseMoving)
    window.removeEventListener('pointerup', handleMouseUp)

  }
  if (store.isExpanded && !store.allowDrag) return // 已固定时，任何地方都不触发拖拽/展开
    distance = 0
    startX = e.clientX + store.pos.right
    startY = e.clientY - store.pos.top
    window.addEventListener('pointermove', mouseMoving)
    window.addEventListener('pointerup', handleMouseUp)
  
}
</script>

<template>
  <div class="drag-layer" @pointerdown="handleMouseDown">
    <slot></slot>
  </div>
</template>

<style scoped>
.drag-layer {
  position: absolute;
  top: 50px;        /* ← 新增 */
  left: 0;
  right: 0;
  bottom: 0;
  inset: 0;
  z-index: 50;
  background: transparent; /* 调试用，可透明 */
  touch-action: none;
  user-select: none;
  cursor: default;
  text-align: center;
}
</style>