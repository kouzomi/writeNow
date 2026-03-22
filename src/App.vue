<script setup lang="ts">
import notebook from './components/notebook/notebook.vue'
import sideMenue from './components/sideMenue/sideMenue.vue'
import navigation from './components/navigation/navigation.vue'
</script>

<template>
  <notebook></notebook>
  <navigation></navigation>
  <side-menue></side-menue>
</template>

<style scoped>
#app {
  /* Vue 项目通常是这个根元素 */
  height: 100vh;
  display: flex;
  color: #2D2926;
}
</style>
