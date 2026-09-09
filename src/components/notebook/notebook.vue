<script setup lang="ts">
import { useNotebookStore } from '@/stores/notebook'
import notebookFold from './part/notebookFold.vue'
import notebookPanel from './part/notebookPanel.vue'

const store = useNotebookStore()
</script>

<template>
  <div
    class="container"
    :class="{ expanded: store.isExpanded, animating: store.isAnimating }"
    :style="{
      right: store.pos.right + 'px',
      top: store.pos.top + 'px',
      width: store.isExpanded ? store.size.width + 'px' : '64px',
      height: store.isExpanded ? store.size.height + 'px' : '64px',
    }"
  >
    <notebookPanel v-if="store.isExpanded" />
    <notebookFold v-else />
  </div>
</template>

<style scoped>
.container {
  position: absolute;
  z-index: 150;
  border: solid 2px var(--border);
  border-radius: 32px;
  overflow: hidden;
  background: var(--bg-surface);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
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
</style>
