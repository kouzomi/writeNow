<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'
import { exportChapterMarkdown } from '@/utils/markdownExport'

const emit = defineEmits<{
  done: []
}>()

const store = useCatalogStore()

const exportCurrentChapter = () => {
  emit('done')
  if (!store.currentChapter) {
    alert(store.isCard ? '请先选择一张卡片' : '请先选择一个章节')
    return
  }
  exportChapterMarkdown(store.currentChapter)
}
</script>

<template>
  <button type="button" @click="exportCurrentChapter">
    {{ store.isCard ? '导出当前卡片' : '导出当前章节' }}
  </button>
</template>
