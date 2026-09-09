<script setup lang="ts">
import { exportLibraryBackup } from '@/utils/backup'

const emit = defineEmits<{
  done: []
}>()

const backupLibrary = () => {
  emit('done')
  exportLibraryBackup()
}
</script>

<template>
  <button type="button" @click="backupLibrary">备份书库</button>
</template>
