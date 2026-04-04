<script setup lang="ts">
import { useNotebookStore } from '@/stores/notebook'

const store = useNotebookStore()
let startWidth = 0
let startHeight = 0

const startResize = (e:PointerEvent) =>{
    if (!store.isExpanded) return

    startWidth = e.clientX
    startHeight = e.clientY
    // 记录开始时的尺寸（以便计算增量）
    const initialWidth = store.size.width
    const initialHeight = store.size.height

    const onResizeMove = (moveEvent: PointerEvent) => {
        store.isAnimating = false
        const deltaX = startWidth - moveEvent.clientX 
        const deltaY = moveEvent.clientY - startHeight

        let newWidth = initialWidth + deltaX
        let newHeight = initialHeight + deltaY
        // 最小尺寸限制（防止缩太小）
        newWidth = Math.max(275, newWidth)     // 最小宽度建议200px
        newHeight = Math.max(150, newHeight)   // 最小高度建议150px

        store.updateSize({
            width: newWidth,
            height: newHeight
        })
        
    }
    const stopResize = () => {
        store.isAnimating = true
        window.removeEventListener('pointermove', onResizeMove)
        window.removeEventListener('pointerup', stopResize)
    }

    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', stopResize)

    e.preventDefault()
    e.stopPropagation()
}
</script>

<template>
    <div class="bottom-resize-handle" @pointerdown.stop="startResize"></div>
</template>

<style scoped>
.bottom-resize-handle {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 20px;
  height: 20px;
  background: #f5f5f5;
  cursor: default; /* 标准的右下角缩放光标 */
  z-index: 52; /* 必须在 drag-layer 上面 */
  border-radius: 0 4px 0 0; /* 可选，美观 */
}

</style>