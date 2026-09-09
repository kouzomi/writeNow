<script setup lang="ts">
import { importMarkdownFile } from '@/utils/markdownActions'

const emit = defineEmits<{
  done: []
}>()

const importMarkdown = () => {
  emit('done')
  void importMarkdownFile()
}
</script>

<template>
  <button type="button" @click="importMarkdown">导入 Markdown</button>
</template>
