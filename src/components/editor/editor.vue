<script setup lang="ts">
import tiptap from './tiptap.vue'
import cardWorkspace from './part/cardWorkspace.vue'
import { useCatalogStore } from '@/stores/shelf'

const store = useCatalogStore()
</script>

<template>
  <div class="container">
    <div class="content">
      <cardWorkspace v-if="store.isCard" />
      <tiptap v-else />
    </div>
    <slot></slot>
  </div>
</template>

<style scoped>
.container {
  position: relative;
  background: transparent;
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
}
.content {
  background: transparent;
  width: 100%;
  height: 100%;
  min-width: 0;
  position: relative;
}
</style>
