<script setup lang="ts">
import { onMounted, watch } from 'vue'
import backupReminder from './components/navigation/part/backupReminder.vue'
import cloudConflict from './components/navigation/part/cloudConflict.vue'
import notebook from './components/notebook/notebook.vue'
import sideMenue from './components/sideMenue/sideMenue.vue'
import navigation from './components/navigation/navigation.vue'
import editor from './components/editor/editor.vue'
import { useSettingsStore } from './stores/settings'
import { startCloudSync } from './utils/cloud/sync'

const settings = useSettingsStore()

watch(
  () => settings.colorScheme,
  (scheme) => {
    document.documentElement.dataset.theme = scheme
  },
  { immediate: true },
)

onMounted(() => {
  void startCloudSync()
})
</script>

<template>
  <notebook v-if="settings.showNotebook"></notebook>
  <navigation></navigation>
  <backupReminder />
  <editor>
    <side-menue></side-menue>
  </editor>
  <cloudConflict />
</template>

<style>
#app {
  height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-app);
  color: var(--text);
}
</style>
