<script setup lang="ts">
import {ref} from 'vue';

interface Props {
    currSize : [number, number]
    isExpanded : boolean
}
const props = withDefaults(defineProps<Props>(), {
    currSize: () => [300, 400],
    isExpanded: () => false,
})
const emit = defineEmits(['changedSize','mosuState'])

const size = ref({
    width: props.currSize[0],
    height: props.currSize[1],
})
const isResizing = ref(false)
let startWidth = 0
let startHeight = 0

const startResize = (e:PointerEvent) =>{
    if (!props.isExpanded) return

    isResizing.value = true
    startWidth = e.clientX
    startHeight = e.clientY
    // 记录开始时的尺寸（以便计算增量）
    const initialWidth = size.value.width
    const initialHeight = size.value.height

    const onResizeMove = (moveEvent: PointerEvent) => {

        const deltaX = startWidth - moveEvent.clientX 
        const deltaY = moveEvent.clientY - startHeight

        let newWidth = initialWidth + deltaX
        let newHeight = initialHeight + deltaY
        // 最小尺寸限制（防止缩太小）
        newWidth = Math.max(275, newWidth)     // 最小宽度建议200px
        newHeight = Math.max(150, newHeight)   // 最小高度建议150px

        size.value.width = newWidth
        size.value.height = newHeight

        emit("changedSize",size.value)
        
    }
    const stopResize = () => {
        isResizing.value = false
        emit('mosuState','resize')
        window.removeEventListener('pointermove', onResizeMove)
        window.removeEventListener('pointerup', stopResize)
        window.removeEventListener('pointercancel', stopResize)
    }

    window.addEventListener('pointermove', onResizeMove)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)

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
  background: rgb(175, 175, 175);
  cursor: default; /* 标准的右下角缩放光标 */
  z-index: 52; /* 必须在 drag-layer 上面 */
  border-radius: 0 4px 0 0; /* 可选，美观 */
}

</style>