<script setup lang="ts">
import { ref,onMounted,watch } from 'vue'
import dragLayer from './dragLayer.vue'
import navigation from './noteNavigation.vue'
import resizeHandle from './resizeHandle.vue'

const isExpanded = ref(false)
const allowDrag = ref(true)
const mouseState = ref('none')
const textContent = ref('')

const pos = ref({ right: 40, top: 40 })
const size = ref({ width: 275, height: 400 })

onMounted(() => {
  const saved = localStorage.getItem('notebook-text')
  if (saved !== null) {
    textContent.value = saved
  }
  console.log('work')
})
watch(textContent, (newValue) => {
  localStorage.setItem('notebook-text', newValue)
})

const move = ({ right, top }: { right: number; top: number }) => {
  pos.value.right = right
  pos.value.top = top
}
const resize = ({ width, height }: { width: number; height: number }) => {
  size.value.width = width
  size.value.height = height
}
const changeDragAllow = (dontDrag: boolean) => {
  allowDrag.value = dontDrag // ← 关键：dontDrag=true 意思是“不要拖” → allowDrag=false
}
const changeExpandAllow = (dontExpand: boolean) => {
  isExpanded.value = dontExpand
}
const cleanTextContent = () =>{
  textContent.value = ''
}
const handleMouseState = (currMouseState: string) => {
  mouseState.value = currMouseState
  if (mouseState.value == 'expand') {
    isExpanded.value = true
  }
}
</script>

<template>
  <div
    class="container"
    :class="{ expanded: isExpanded }"
    :style="{
      right: pos.right + 'px',
      top: pos.top + 'px',
      width: isExpanded ? size.width + 'px' : '64px',
      height: isExpanded ? size.height + 'px' : '64px',
    }"
  >
    <div v-if="isExpanded" class="container-expand">
      <navigation
        :allow-drag="allowDrag"
        @dont-expand="changeExpandAllow"
        @dont-drag="changeDragAllow"
        @clean-text="cleanTextContent"
      ></navigation>
      <dragLayer
        :curr-pos="[pos.right, pos.top]"
        :allow-drag="allowDrag"
        :is-expanded="true"
        :mouse-state="mouseState"
        @moved-pos="move"
        @mouse-state="handleMouseState"
      >
        <textarea
          class="text-editor"
          placeholder="请输入文本"
          :style="{
            width: size.width - 50 + 'px',
            height: size.height - 55 + 'px',
          }"
          v-model="textContent"
          ></textarea
        >

        <resizeHandle
          :curr-size="[size.width, size.height]"
          :is-expanded="true"
          @changed-size="resize"
          @mosu-state="handleMouseState"
        ></resizeHandle>
      </dragLayer>
    </div>

    <div v-else class="container-fold">
      <div class="fold-icon">🌕</div>
      <dragLayer
        :curr-pos="[pos.right, pos.top]"
        :allow-drag="true"
        :is-expanded="false"
        :mouse-state="mouseState"
        @moved-pos="move"
        @mouse-state="handleMouseState"
      >
      </dragLayer>
    </div>
  </div>
</template>

<style scoped>
.container {
  position: absolute;
  z-index: 100;
  border: solid 2px black;
  border-radius: 32px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: move;
  user-select: none;
  /*transition: width 0.2s, height 0.2s, border-radius 0.2s;*/
}
.container.expanded {
  width: 300px;
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  cursor: default;
}
.container-expand {
  display: flex;
  position: relative;
  overflow: hidden;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.container-fold {
  width: 100%;
  height: 100%;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
}
.fold-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  color: #ffd700; /* 金黄色月亮 */
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  user-select: none;
  transition: transform 0.2s;
}

.container-fold:hover .fold-icon {
  transform: scale(1.12); /* 鼠标悬停时稍微放大 */
}

.text-editor {
  position: relative;
  top: 50px;
  border: none;
  line-height: 20px;
  z-index: 52;
  background: yellow;
  outline: none;
  resize: none;
}
</style>
