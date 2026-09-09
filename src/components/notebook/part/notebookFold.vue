<script setup lang="ts">
import dragLayer from './dragLayer.vue'
</script>

<template>
  <div class="container-fold">
    <div class="fold-icon">🌕</div>
    <dragLayer />
  </div>
</template>

<style scoped>
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
  color: #ffd700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  user-select: none;
  transition: transform 0.2s;
}
.container-fold:hover .fold-icon {
  transform: scale(1.12);
}
</style>
