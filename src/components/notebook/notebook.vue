<script setup lang="ts">
import { ref,computed } from 'vue'

//展开
const isExpanded = ref(false)           
const noteContent = ref('')

const stickState = ref('固定')
//拖拽
const allowDrag = ref(true)
const pos = ref({ right: 40, top: 40 })
const isDragging = ref(false)
let startX = 0
let startY = 0
let dragPerformed = false
//缩放
const isResizing = ref(false)          // 是否正在调整大小
const resizeStart = { x: 0, y: 0 }     // 调整大小时的起点（鼠标位置 + 当前尺寸）

const currentWidth = ref(300)
const currentHeight = ref(400)

//拖拽
const startDrag = (e: PointerEvent) => {

    if(e.target instanceof HTMLElement &&e.target.closest('.resize-handle' )) return;
 
    else if(!allowDrag.value) return

    isDragging.value = true
    dragPerformed = false

    // 注意这里的正负号（因为用的是 right）
    startX = e.clientX + pos.value.right
    startY = e.clientY - pos.value.top

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)

    e.preventDefault()
}

const onMove = (e: PointerEvent) => {
    if (!isDragging.value) return

    // 移动距离判断（可优化，但先保持你的逻辑）
    const dx = Math.abs(e.clientX - (startX - pos.value.right))
    const dy = Math.abs(e.clientY - (startY + pos.value.top))
    if (dx > 5 || dy > 5) {
        dragPerformed = true
    }

    // 核心：更新 right 和 top
    pos.value.right = startX - e.clientX
    pos.value.top   = e.clientY - startY
}

const stopDrag = () => {
    isDragging.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stopDrag)
    window.removeEventListener('pointercancel', stopDrag)
}
//展开
const open = () => {
    if (!dragPerformed) {
        isExpanded.value = true
    }
}

const close = () => {
    isExpanded.value = false
}

const handleContainerClick = (e: MouseEvent) => {
    if (dragPerformed) {
        e.stopPropagation()
        e.preventDefault()
        dragPerformed = false
        return
    }
    open()
}
//固定
const changeStickState = (e: MouseEvent) =>{
    if (dragPerformed) {
        dragPerformed = false
        return
    }
    allowDrag.value = !allowDrag.value
    if(!allowDrag.value) stickState.value = "解锁";
    else stickState.value = "固定";
}
//缩放
const startResize = (e: PointerEvent) => {
  // 只在展开状态下允许调整大小
  if (!isExpanded.value) return

  isResizing.value = true
  dragPerformed = false   // 防止误触发点击

  resizeStart.x = e.clientX
  resizeStart.y = e.clientY

  // 记录开始时的尺寸（以便计算增量）
  const initialWidth = currentWidth.value
  const initialHeight = currentHeight.value

  const onResizeMove = (moveEvent: PointerEvent) => {
    if (!isResizing.value) return

    const deltaX = resizeStart.x - moveEvent.clientX 
    const deltaY = moveEvent.clientY - resizeStart.y

    // 从右上角定位 → 向右下拖拽增加宽度/高度，向左上拖拽减小
    let newWidth = initialWidth + deltaX
    let newHeight = initialHeight + deltaY

    // 最小尺寸限制（防止缩太小）
    newWidth = Math.max(200, newWidth)     // 最小宽度建议200px
    newHeight = Math.max(150, newHeight)   // 最小高度建议150px

    // 可选：最大尺寸限制
    newWidth = Math.min(window.innerWidth - pos.value.right - 20, newWidth)
    newHeight = Math.min(window.innerHeight - pos.value.top - 20, newHeight)

    currentWidth.value = newWidth
    currentHeight.value = newHeight
  }

  const stopResize = () => {
    isResizing.value = false
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
  <div
    class="container"
    :class="{ expanded: isExpanded }"
    :style="{ 
        right: pos.right + 'px', 
        top: pos.top + 'px',
        width: isExpanded ? currentWidth + 'px' : '64px',
        height: isExpanded ? currentHeight + 'px' : '64px',
        }"
    @pointerdown="startDrag"
    @click="handleContainerClick"
  >
    <!-- 展开状态 -->
    <div v-if="isExpanded" class="expanded-content">
        <div class="navigation">
            <button @click.stop="close">关闭</button>
            <button @click.stop="changeStickState" :class="{stick:!allowDrag}">{{stickState}}</button>
        </div>
        <textarea
            placeholder="写点什么"
            v-model="noteContent"
        ></textarea>
        <div
            class="resize-handle"
            @pointerdown.stop="startResize"
        >
        </div>

    </div>

    <!-- 收起状态 -->
    <div v-else class="collapsed-content">
      <span class="handle">📝</span>
    </div>
  </div>
</template>

<style scoped>
.container {
  position: absolute;
  width: 64px;
  height: 64px;
  z-index: 999;
  border: solid 2px black;
  border-radius: 32px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: move;
  user-select: none;
  transition: width 0.2s, height 0.2s, border-radius 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.container.expanded {
  width: 300px;
  height: 400px;
  border-radius: 16px;
  cursor: default;
}

.expanded-content {
  display: flex;
  position: relative;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.navigation {
  display: flex;
  min-height: 40px;
  flex-direction: row-reverse;
  align-items: center;
  gap: 10px;
  border-bottom: solid 1px #ddd;
  padding: 0 12px;
  background: #f5f5f5;
  flex-shrink: 0;
}

button.stick {
    background: black;
    color: white;
}

button {
  height: 28px;
  padding: 0 12px;
  border: 1px solid #ccc;
  border-radius: 14px;
  background: white;
  cursor: pointer;
  font-size: 13px;
}

textarea {
  width: 100%;
  flex: 1;
  border: none;
  resize: none;
  padding: 12px;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 14px;
  min-height: 0;
}

textarea:focus {
  outline: none;
}

.collapsed-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  background: #ccc;
  cursor: nwse-resize;          /* 斜向调整大小光标 */
  border-radius: 0 0 4px 0;
  z-index: 10;
}

.resize-handle:hover {
  background: #999;
}

.container *:not(textarea) {
  user-select: none;
}

textarea {
  user-select: text;
  cursor: text;
}
</style>

