<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { cloudSync, connectOneDrive, flushCloudPush, isLibraryDirty, syncNow } from '@/utils/cloud/sync'

const settings = useSettingsStore()
const snoozed = ref(false)

const problem = computed(() => {
  if (!settings.cloudEnabled || cloudSync.conflict) return null
  if (cloudSync.needsReauth) return 'reauth' as const
  if (cloudSync.lastError) return 'error' as const
  return null
})

const visible = computed(() => problem.value != null && !snoozed.value)

const message = computed(() => {
  if (problem.value === 'reauth') return 'OneDrive 登录已过期，云端备份暂停了。'
  if (cloudSync.lastError) return `OneDrive 同步失败：${cloudSync.lastError}`
  return ''
})

const primaryLabel = computed(() => (problem.value === 'reauth' ? '重新连接' : '重试'))

watch(problem, () => {
  snoozed.value = false
})

const runPrimary = () => {
  if (problem.value === 'reauth') {
    void connectOneDrive().catch(() => {
      if (cloudSync.lastError) return
    })
    return
  }
  void syncNow()
}

const onBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!settings.cloudEnabled) return
  if (isLibraryDirty()) void flushCloudPush()
  if (!cloudSync.lastError && !cloudSync.needsReauth) return
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
