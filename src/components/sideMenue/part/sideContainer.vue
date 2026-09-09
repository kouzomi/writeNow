<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'
import { VueDraggable } from 'vue-draggable-plus'
import sideBlocks from './sideBlocks.vue'

const store = useCatalogStore()
</script>

<template>
  <div class="scroll-wrapper">
    <VueDraggable
      class="container"
      v-model="store.currentCatalogList"
      handle=".tool-bar"
      :animation="180"
    >
      <sideBlocks v-for="item in store.currentCatalogList" :key="item.id" :catalog="item" />
    </VueDraggable>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}
.scroll-wrapper {
  height: 100%;
  width: 100%;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
}
.scroll-wrapper::-webkit-scrollbar {
  width: 8px;
}

.scroll-wrapper::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}
.scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(198, 188, 188, 0.2);
  border-radius: 4px;
}
</style>
