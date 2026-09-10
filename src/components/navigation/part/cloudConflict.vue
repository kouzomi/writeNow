<script setup lang="ts">
import { exportLibraryBackup } from '@/utils/backup'
import { cloudSync, resolveCloudConflict } from '@/utils/cloud/sync'

const chooseLocal = () => {
  void resolveCloudConflict('local')
}

const exportThenRemote = () => {
  exportLibraryBackup()
  void resolveCloudConflict('remote')
}

const chooseRemote = () => {
  if (!confirm('用云端覆盖本机会丢掉这边未同步的修改。确定继续？')) return
  void resolveCloudConflict('remote')
}
</script>

<template>
  <div v-if="cloudSync.conflict" class="overlay">
    <div class="dialog" role="dialog" aria-labelledby="cloud-conflict-title">
      <p id="cloud-conflict-title">本机和 OneDrive 上的书库都有改动，无法自动合并。</p>
      <p class="hint">选一边覆盖另一边。选云端前可以先导出本机备份。</p>
      <div class="actions">
        <button type="button" :disabled="cloudSync.syncing" @click="chooseLocal">用本机覆盖云端</button>
        <button type="button" :disabled="cloudSync.syncing" @click="exportThenRemote">先导出本机，再用云端</button>
        <button type="button" :disabled="cloudSync.syncing" @click="chooseRemote">用云端覆盖本机</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.35);
}
.dialog {
  max-width: 420px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
.hint {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
button {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
}
button:disabled {
  cursor: default;
  opacity: 0.6;
}
</style>
