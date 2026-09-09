<script setup lang="ts">
import { watch } from 'vue'
import notebook from './components/notebook/notebook.vue'
import sideMenue from './components/sideMenue/sideMenue.vue'
import navigation from './components/navigation/navigation.vue'
import editor from './components/editor/editor.vue'
import { useSettingsStore } from './stores/settings'

const settings = useSettingsStore()

watch(
  () => settings.colorScheme,
  (scheme) => {
    document.documentElement.dataset.theme = scheme
  },
  { immediate: true },
)
</script>

<template>
  <notebook v-if="settings.showNotebook"></notebook>
  <navigation></navigation>
  <editor>
    <side-menue></side-menue>
  </editor>
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
