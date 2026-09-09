<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import navMenu from './navMenu.vue'

const settings = useSettingsStore()
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
    </div>
  </navMenu>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
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
</style>
