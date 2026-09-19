<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'

const store = useCatalogStore()
</script>

<template>
  <button
    class="toggle-btn"
    :class="{ isChosen: store.isMenueExpanded }"
    @click="store.toggleMenueExpand"
  >
    {{ store.isMenueExpanded ? '◀' : '▶' }}
  </button>
</template>

<style scoped>
.toggle-btn {
  box-sizing: border-box;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: var(--bg-chrome);
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
  border: none;
  border-right: solid 2px var(--border);
  border-bottom: solid 2px var(--border);
}

@media (max-width: 768px) {
  .toggle-btn {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
}
</style>
