<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'
import { exportCatalogMarkdown } from '@/utils/markdownExport'

const emit = defineEmits<{
  done: []
}>()

const store = useCatalogStore()

const exportCurrentCatalog = () => {
  emit('done')
  if (!store.currentCatalog) {
    alert(store.isCard ? '请先在左侧点选一个组' : '请先在左侧点选一卷')
    return
  }
  exportCatalogMarkdown(store.currentCatalog)
}
</script>

<template>
  <button type="button" @click="exportCurrentCatalog">
    {{ store.isCard ? '导出当前组' : '导出当前卷' }}
  </button>
</template>
