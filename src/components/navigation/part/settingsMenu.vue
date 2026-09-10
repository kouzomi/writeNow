<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import navMenu from './navMenu.vue'
import {
  cloudSync,
  connectOneDrive,
  disconnectOneDrive,
  isCloudConfigured,
  syncNow,
} from '@/utils/cloud/sync'
import { formatCloudSyncAt } from '@/utils/backup'

const settings = useSettingsStore()

const statusText = computed(() => {
  if (!isCloudConfigured()) {
    return '未配置。复制 .env.local.example 为 .env.local，填入 Azure 应用程序 ID 后重启开发服务。'
  }
  if (cloudSync.needsReauth) return '登录已过期，需要重新连接。'
  if (cloudSync.conflict) return '本机与云端冲突，请先选择保留哪一份。'
  if (cloudSync.syncing) return '正在同步…'
  if (settings.cloudEnabled) {
    const account = settings.cloudAccountName ?? 'OneDrive'
    return `已连接 ${account} · 上次同步：${formatCloudSyncAt(settings.lastCloudSyncAt)}`
  }
  return '未连接。连接后书库会同步到 OneDrive。换电脑打开同一网址，登录同一个微软账号即可。'
})

const connect = async () => {
  if (!isCloudConfigured()) {
    alert('未配置 OneDrive。请复制 .env.local.example 为 .env.local，填入 Azure 应用程序(客户端) ID。')
    return
  }
  try {
    await connectOneDrive()
  } catch {
    if (cloudSync.lastError) alert(cloudSync.lastError)
  }
}

const disconnect = async () => {
  if (!confirm('断开后将停止自动同步，本机书库仍保留。确定断开 OneDrive？')) return
  await disconnectOneDrive()
}
</script>

<template>
  <navMenu id="settings" label="设置 ▾">
    <div class="panel" @click.stop>
      <label class="row">
        <span>主题</span>
        <select
          :value="settings.colorScheme"
          @change="settings.setColorScheme(($event.target as HTMLSelectElement).value as 'light' | 'dark')"
        >
          <option value="light">亮色</option>
          <option value="dark">暗色</option>
        </select>
      </label>
      <label class="row">
        <span>正文字号</span>
        <select :value="settings.fontSize" @change="settings.setFontSize(Number(($event.target as HTMLSelectElement).value))">
          <option :value="15">小</option>
          <option :value="17">中</option>
          <option :value="19">大</option>
        </select>
      </label>
      <label class="row">
        <span>显示便签</span>
        <input
          type="checkbox"
          :checked="settings.showNotebook"
          @change="settings.setShowNotebook(($event.target as HTMLInputElement).checked)"
        />
      </label>
      <div class="cloud">
        <div class="cloud-title">OneDrive 同步</div>
        <p class="hint">{{ statusText }}</p>
        <p v-if="cloudSync.lastError && !cloudSync.syncing" class="error">{{ cloudSync.lastError }}</p>
        <div class="actions">
          <button
            v-if="!settings.cloudEnabled || cloudSync.needsReauth"
            type="button"
            :disabled="cloudSync.syncing"
            @click="connect"
          >
            {{ cloudSync.needsReauth ? '重新连接' : '连接 OneDrive' }}
          </button>
          <button
            v-if="settings.cloudEnabled && !cloudSync.needsReauth"
            type="button"
            :disabled="cloudSync.syncing || !!cloudSync.conflict"
            @click="syncNow"
          >
            立即同步
          </button>
          <button v-if="settings.cloudEnabled" type="button" :disabled="cloudSync.syncing" @click="disconnect">
            断开
          </button>
        </div>
      </div>
    </div>
  </navMenu>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 260px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 13px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
select {
  height: 26px;
  color: var(--text);
  background: var(--bg-surface);
  border: 1px solid var(--border);
}
.cloud {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-soft);
}
.cloud-title {
  font-weight: 600;
}
.hint,
.error {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
}
.hint {
  color: var(--text-muted);
}
.error {
  color: #b42318;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
