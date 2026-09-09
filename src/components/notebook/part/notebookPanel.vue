<script setup lang="ts">
import navigation from './noteNavigation.vue'
import resizeHandle from './resizeHandle.vue'
import texteditor from './texteditor.vue'
</script>

<template>
  <div class="container-expand">
    <navigation />
    <div class="editor-body">
      <texteditor></texteditor>
      <resizeHandle />
    </div>
  </div>
</template>

<style scoped>
.container-expand {
  display: flex;
  position: relative;
  overflow: hidden;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
.editor-body {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  cursor: text;
  user-select: text;
}
</style>
