<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import {
  cloudSync,
  connectOneDrive,
  getCloudUiStatus,
  isLibraryDirty,
  labelForCloudUi,
  syncNow,
} from '@/utils/cloud/sync'
import { packLibraryBackup } from '@/utils/backup'

const settings = useSettingsStore()

const status = computed(() => {
  void settings.cloudEnabled
  void settings.lastSyncedContentKey
  void cloudSync.syncing
  void cloudSync.conflict
  void cloudSync.needsReauth
  void cloudSync.lastError
  void packLibraryBackup()
  void isLibraryDirty()
  return getCloudUiStatus()
})

const label = computed(() => labelForCloudUi(status.value))
const visible = computed(() => status.value !== 'off')

const title = computed(() => {
  if (cloudSync.lastError) return cloudSync.lastError
  if (status.value === 'dirty') return '有未上传的改动，点击立即同步'
  if (status.value === 'ok') return '点击可立即与 OneDrive 对一次'
  if (status.value === 'reauth') return '登录已过期，点击重新连接'
  return label.value
})

const onClick = () => {
  if (status.value === 'syncing' || status.value === 'conflict' || status.value === 'off') return
  if (status.value === 'reauth') {
    void connectOneDrive().catch(() => {
      if (cloudSync.lastError) alert(cloudSync.lastError)
    })
    return
  }
  void syncNow().catch(() => {
    if (cloudSync.lastError) alert(cloudSync.lastError)
  })
}
</script>

<template>
  <button
    v-if="visible"
    type="button"
    class="sync-status"
    :class="status"
    :title="title"
    :disabled="status === 'syncing' || status === 'conflict'"
    @click="onClick"
  >
    {{ label }}
  </button>
</template>

<style scoped>
.sync-status {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-soft);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.sync-status:disabled {
  cursor: default;
  opacity: 0.85;
}
.sync-status.ok {
  color: var(--text-muted);
}
.sync-status.dirty,
.sync-status.syncing {
  color: var(--text);
}
.sync-status.error,
.sync-status.reauth,
.sync-status.conflict {
  color: #b42318;
  border-color: #b42318;
}
</style>
