<script setup lang="ts">
import backupMenu from './part/backupMenu.vue'
import markdownMenu from './part/markdownMenu.vue'
import settingsMenu from './part/settingsMenu.vue'
import searchBar from './part/searchBar.vue'
import syncStatus from './part/syncStatus.vue'
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
      <syncStatus />
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
  min-width: 0;
}

@media (max-width: 768px) {
  .navigation {
    height: auto;
    min-height: 52px;
    padding: 8px 12px;
    padding-top: max(8px, env(safe-area-inset-top));
    gap: 8px;
    flex-wrap: wrap;
  }
  .brand-logo {
    height: 28px;
  }
  .button-bar {
    flex: 1 1 100%;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    gap: 6px;
    padding-bottom: 2px;
  }
  .button-bar::-webkit-scrollbar {
    display: none;
  }
}
</style>
