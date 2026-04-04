<script setup lang="ts">
import { useNotebookStore } from '@/stores/notebook'
import dragLayer from './part/dragLayer.vue'
import navigation from './part/noteNavigation.vue'
import resizeHandle from './part/resizeHandle.vue'
import texteditor from './part/texteditor.vue'
const store = useNotebookStore()
</script>

<template>
  <div
    class="container"
    :class="{ expanded: store.isExpanded, animating: store.isAnimating  }"
    :style="{
      right: store.pos.right + 'px',
      top: store.pos.top + 'px',
      width: store.isExpanded ? store.size.width + 'px' : '64px',
      height: store.isExpanded ? store.size.height + 'px' : '64px',
    }"
  >
    <div v-if="store.isExpanded" class="container-expand">
      <navigation />
      <dragLayer>
        <texteditor></texteditor>
        <resizeHandle />
      </dragLayer>
    </div>

    <div v-else class="container-fold">
      <div class="fold-icon">🌕</div>
      <dragLayer />
    </div>
  </div>
</template>

<style scoped>
.container {
  position: absolute;
  z-index: 150;
  border: solid 2px black;
  border-radius: 32px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: move;
  user-select: none;
}
.container.expanded {
  width: 300px;
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  cursor: default;
}
.animating {
  transition: 
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
    height 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
    border-radius 0.4s ease;
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
  top: 55px;
  vertical-align: top;
  border: none;
  line-height: 20px;
  z-index: 52;
  background: transparent;
  outline: none;
  resize: none;
  font-size: 15px;
}
</style>
