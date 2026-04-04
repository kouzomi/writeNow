<script setup lang="ts">
import notebook from './components/notebook/notebook.vue'
import sideMenue from './components/sideMenue/sideMenue.vue'
import navigation from './components/navigation/navigation.vue'
import editor from './components/editor/editor.vue'
</script>

<template>
  <notebook></notebook>
  <navigation></navigation>
  <editor>
    <side-menue></side-menue>
  </editor>
</template>

<style>
#app {
  /* 确保占据全屏 */
  height: 100dvh;
  width: 100vw; /* 修正单位 */

  /* 改为垂直排列 */
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}
</style>
