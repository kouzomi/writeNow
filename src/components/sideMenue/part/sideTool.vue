<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'
const store = useCatalogStore()
</script>

<template>
  <div class="navigation">
    <label>目录</label>
    <button @click="store.createCatalog">{{ store.isCard ? '+ 组' : '+ 卷' }}</button>
  </div>
</template>

<style scoped>
.navigation {
  position: relative;
  display: flex;
  height: 40px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  gap: 8px;
  flex-shrink: 0;
}
label {
  display: flex;
  align-items: center;
  height: 28px;
  width: 50px;
  font-size: 15px;
  flex-shrink: 0;
  overflow: hidden;
  color: var(--text);
}
button {
  height: 28px;
  width: 75px;
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  flex-shrink: 0;
  overflow: hidden;
  font-size: 15px;
}
</style>