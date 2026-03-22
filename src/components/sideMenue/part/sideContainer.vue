<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'
import { VueDraggable } from 'vue-draggable-plus'
import sideBlocks from './sideBlocks.vue';

const store = useCatalogStore()
</script>

<template>
  <div class="scroll-wrapper">
    <VueDraggable class="container" v-model="store.currentCatalogList">
      <sideBlocks v-for="item in store.currentCatalogList" :key="item.id" :catalog="item">
        {{ item.id }} - {{ store.viewMode }}模式
      </sideBlocks>
    </VueDraggable>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;

}
.scroll-wrapper {
  height: 100%;
  width: 100%;
  flex: 1; /* 占满剩余高度 */
  overflow-y: auto; /* 关键！内部滚动 */
  overflow-x: hidden;
}
.scroll-wrapper::-webkit-scrollbar {
  width: 8px; /* 让滚动条变细 */
}

.scroll-wrapper::-webkit-scrollbar-track {
  background: transparent; /* 轨道透明 */
  border-radius: 4px;
}
.scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(198, 188, 188, 0.2); /* 半透明灰色 */
  border-radius: 4px;
}
</style>
