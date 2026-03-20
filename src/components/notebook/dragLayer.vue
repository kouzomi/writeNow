<script setup lang="ts">
import { max } from 'lodash-es'
import { ref } from 'vue'
//从父组件接收参数
interface Props {
  currPos: [number, number] // 可选
  allowDrag: boolean
  isExpanded: boolean
  mouseState: string
}
const props = withDefaults(defineProps<Props>(), {
  currPos: () => [0, 0], // 默认位置
  allowDrag: () => true,
  isExpanded: () => false,
})
const emit = defineEmits(['movedPos', 'mouseState'])

//基础参数
const pos = ref({
  right: props.currPos[0],
  top: props.currPos[1],
})

//实现拖拽或点击
const isDragging = ref(false)
const isClicking = ref(false)
let startX = 0
let startY = 0
let distance = 0

const handleMouseDown = (e: PointerEvent) => {
  const mouseMoving = (e: PointerEvent) => {
    const dx = Math.abs(e.clientX - (startX - pos.value.right))
    const dy = Math.abs(e.clientY + (startY + pos.value.top))
    distance = Math.sqrt(dx*dx + dy*dy)

    if (distance > 5) {
      pos.value.right = startX - e.clientX
      pos.value.top = e.clientY - startY
      emit('movedPos', pos.value)
      emit('mouseState','drag')
      isDragging.value = true
    }
    else isClicking.value = true
  }
  const handleMouseUp = (e: PointerEvent) => {
    //console.log(pos.value)
    if (isClicking.value || distance == 0) {
      if(!props.isExpanded) emit('mouseState', 'expand')
      
    }
    isClicking.value = false
    isDragging.value = false
    window.removeEventListener('pointermove', mouseMoving)
    window.removeEventListener('pointerup', handleMouseUp)

  }
  //if(props.mouseState == 'none'){
  if (!props.allowDrag) return // 已固定时，任何地方都不触发拖拽/展开
    distance = 0
    startX = e.clientX + pos.value.right
    startY = e.clientY - pos.value.top
    window.addEventListener('pointermove', mouseMoving)
    window.addEventListener('pointerup', handleMouseUp)

  //}

    
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