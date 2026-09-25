<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'

const store = useCatalogStore()
</script>

<template>
  <div class="navigation">
    <label>目录</label>
    <div class="actions">
      <button type="button" @click="store.createCatalog">{{ store.isCard ? '+ 组' : '+ 卷' }}</button>
    </div>
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
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
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

@media (max-width: 768px) {
  .navigation {
    padding: 0 8px;
    gap: 4px;
  }
  label {
    width: auto;
    font-size: 14px;
  }
  button {
    width: auto;
    padding: 0 6px;
    font-size: 14px;
  }
}
</style>
