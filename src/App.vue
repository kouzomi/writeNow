<script setup lang="ts">
import notebook from './components/notebook/notebook.vue';
import sideMenue from './components/sideMenue/sideMenue.vue';
</script>

<template>

  <notebook></notebook>
  <side-menue></side-menue>
</template>

<style scoped>
#app {           /* Vue 项目通常是这个根元素 */
  height: 100%;
}
</style>
