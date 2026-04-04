<script setup lang="ts">
import tiptap from './tiptap.vue';
</script>

<template>
  <div class="container">
      <slot></slot>
      <div  class="content">
        <tiptap></tiptap>
      </div>
  </div>
</template>

<style scoped>
.container {
  background: transparent;
  height: 100%;
  width: 100%;
  display: flex;
}
.content {
  background:transparent;
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
