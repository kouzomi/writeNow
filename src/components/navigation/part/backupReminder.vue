<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useNotebookStore } from '@/stores/notebook'
import { useSettingsStore } from '@/stores/settings'
import { useCatalogStore } from '@/stores/shelf'
import {
  exportLibraryBackup,
  formatBackupAt,
  formatCloudSyncAt,
  hasWritableContent,
  isBackupStale,
} from '@/utils/backup'
import { cloudSync, flushCloudPush, isLibraryDirty, syncNow } from '@/utils/cloud/sync'

const settings = useSettingsStore()
const catalog = useCatalogStore()
const notebook = useNotebookStore()
const snoozed = ref(false)

const hasContent = computed(() => {
  void catalog.hasCatalogContent
  void notebook.textContent
  return hasWritableContent()
})

const stale = computed(() =>
  settings.cloudEnabled ? isBackupStale(settings.lastCloudSyncAt) : isBackupStale(settings.lastBackupAt),
)

const visible = computed(() => {
  if (snoozed.value || !hasContent.value || cloudSync.conflict) return false
  if (settings.cloudEnabled && cloudSync.lastError) return true
  return stale.value
})

const message = computed(() => {
  if (settings.cloudEnabled) {
    if (cloudSync.lastError) return `OneDrive 同步失败：${cloudSync.lastError}`
    if (settings.lastCloudSyncAt == null) return '已连接 OneDrive，但还没有成功同步。建议现在同步一次。'
    return `距离上次同步已超过 3 天（${formatCloudSyncAt(settings.lastCloudSyncAt)}）。建议再同步一次。`
  }
  return settings.lastBackupAt == null
    ? '书库只保存在本机浏览器里，清除站点数据会丢失。建议现在导出一份备份。'
    : `距离上次备份已超过 3 天（${formatBackupAt(settings.lastBackupAt)}）。建议再导出一份。`
})

const primaryLabel = computed(() => (settings.cloudEnabled ? '立即同步' : '立即备份'))

const runPrimary = () => {
  if (settings.cloudEnabled) {
    void syncNow()
    return
  }
  exportLibraryBackup()
}

const onBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!hasWritableContent()) return
  if (settings.cloudEnabled) {
    if (!isLibraryDirty()) return
    void flushCloudPush()
    event.preventDefault()
    event.returnValue = ''
    return
  }
  if (!isBackupStale(settings.lastBackupAt)) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <div v-if="visible" class="reminder">
    <span>{{ message }}</span>
    <div class="actions">
      <button type="button" :disabled="cloudSync.syncing" @click="runPrimary">{{ primaryLabel }}</button>
      <button type="button" class="later" @click="snoozed = true">稍后</button>
    </div>
  </div>
</template>

<style scoped>
.reminder {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 8px 20px;
  background: var(--bg-selected-soft);
  border-bottom: 1px solid var(--border-soft);
  color: var(--text);
  font-size: 13px;
  flex-shrink: 0;
}
.actions {
  display: flex;
  gap: 8px;
}
button {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
}
button.later {
  border-color: var(--border-soft);
}
button:disabled {
  cursor: default;
  opacity: 0.6;
}
</style>
