<script setup lang="ts">
import { useNotebookDrag } from './useNotebookDrag'

const { handlePointerDown } = useNotebookDrag()
</script>

<template>
  <div class="drag-layer" @pointerdown="handlePointerDown">
    <slot></slot>
  </div>
</template>

<style scoped>
.drag-layer {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: transparent;
  touch-action: none;
  user-select: none;
  cursor: pointer;
}
</style>
