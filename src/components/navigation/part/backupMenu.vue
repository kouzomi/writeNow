<script setup lang="ts">
import backupItem from './backupItem.vue'
import navMenu from './navMenu.vue'
import restoreItem from './restoreItem.vue'
import { useSettingsStore } from '@/stores/settings'
import { formatBackupAt } from '@/utils/backup'

const settings = useSettingsStore()
</script>

<template>
  <navMenu id="backup" label="备份 / 恢复 ▾" v-slot="{ close }">
    <div class="status">上次备份：{{ formatBackupAt(settings.lastBackupAt) }}</div>
    <backupItem @done="close" />
    <restoreItem @done="close" />
  </navMenu>
</template>

<style scoped>
.status {
  padding: 8px 12px;
  color: var(--text-muted);
  font-size: 12px;
  border-bottom: 1px solid var(--border-soft);
}
</style>
