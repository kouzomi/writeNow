<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import backupReminder from './components/navigation/part/backupReminder.vue'
import cloudConflict from './components/navigation/part/cloudConflict.vue'
import notebook from './components/notebook/notebook.vue'
import sideMenue from './components/sideMenue/sideMenue.vue'
import navigation from './components/navigation/navigation.vue'
import editor from './components/editor/editor.vue'
import { useSettingsStore } from './stores/settings'
import { useCatalogStore } from './stores/shelf'
import { startCloudSync } from './utils/cloud/sync'
import { initMobileListener, isMobile } from './utils/mobile'

const settings = useSettingsStore()
const catalog = useCatalogStore()
let stopMobile: (() => void) | undefined

watch(
  () => settings.colorScheme,
  (scheme) => {
    document.documentElement.dataset.theme = scheme
  },
  { immediate: true },
)

watch(isMobile, (mobile) => {
  if (mobile && catalog.isMenueExpanded) {
    catalog.isMenueExpanded = false
  }
})

onMounted(() => {
  stopMobile = initMobileListener()
  if (isMobile.value) catalog.isMenueExpanded = false
  void startCloudSync()
})

onUnmounted(() => {
  stopMobile?.()
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
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  box-sizing: border-box;
}
</style>
