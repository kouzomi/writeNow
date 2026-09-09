<script setup lang="ts">
import backupMenu from './part/backupMenu.vue'
import markdownMenu from './part/markdownMenu.vue'
import settingsMenu from './part/settingsMenu.vue'
import searchBar from './part/searchBar.vue'
import writeNowLogo from '@/assets/writenow-logo.png'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <div class="navigation">
    <div class="icon">
      <img
        class="brand-logo"
        :class="{ 'is-dark': settings.colorScheme === 'dark' }"
        :src="writeNowLogo"
        alt="writeNow"
      />
    </div>
    <div class="button-bar">
      <searchBar />
      <markdownMenu />
      <backupMenu />
      <settingsMenu />
    </div>
  </div>
</template>

<style scoped>
.navigation {
  position: relative;
  display: flex;
  height: 70px;
  width: 100%;
  box-sizing: border-box;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-bottom: solid 2px var(--border);
  padding: 0 20px;
  background-color: var(--bg-chrome);
  flex-shrink: 0;
  gap: 16px;
}
.icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.brand-logo {
  height: 36px;
  width: auto;
  display: block;
}
.brand-logo.is-dark {
  filter: invert(1);
}
.button-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
