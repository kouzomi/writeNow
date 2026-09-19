<script setup lang="ts">
import { computed } from 'vue'
import { useNotebookStore } from '@/stores/notebook'
import { isMobile } from '@/utils/mobile'
import notebookFold from './part/notebookFold.vue'
import notebookPanel from './part/notebookPanel.vue'

const store = useNotebookStore()

const boxStyle = computed(() => {
  if (isMobile.value && store.isExpanded) {
    return {
      right: '8px',
      left: '8px',
      top: 'auto',
      bottom: 'max(8px, env(safe-area-inset-bottom))',
      width: 'auto',
      height: 'min(70dvh, 520px)',
    }
  }
  if (isMobile.value) {
    return {
      right: '12px',
      top: 'auto',
      bottom: 'max(12px, env(safe-area-inset-bottom))',
      width: '56px',
      height: '56px',
    }
  }
  return {
    right: store.pos.right + 'px',
    top: store.pos.top + 'px',
    width: store.isExpanded ? store.size.width + 'px' : '64px',
    height: store.isExpanded ? store.size.height + 'px' : '64px',
  }
})
</script>

<template>
  <div
    class="container"
    :class="{ expanded: store.isExpanded, animating: store.isAnimating, mobile: isMobile }"
    :style="boxStyle"
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
.container.mobile {
  position: fixed;
}
.animating {
  transition:
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.4s ease;
}
</style>
