<script setup lang="ts">
import { importLibraryBackup } from '@/utils/backup'

const emit = defineEmits<{
  done: []
}>()

const restoreLibrary = async () => {
  emit('done')
  if (!confirm('恢复备份会覆盖当前所有卷、章节和便签，确定继续？')) return
  const result = await importLibraryBackup()
  if (result === 'cancelled') return
  if (result === 'invalid') {
    alert('这不是有效的 writeNow 备份文件')
    return
  }
  alert('已恢复备份')
}
</script>

<template>
  <button type="button" @click="restoreLibrary">恢复备份</button>
</template>
