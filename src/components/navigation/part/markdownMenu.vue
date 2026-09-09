<script setup lang="ts">
import exportChapterItem from './exportChapterItem.vue'
import exportVolumeItem from './exportVolumeItem.vue'
import importMarkdownItem from './importMarkdownItem.vue'
import navMenu from './navMenu.vue'
</script>

<template>
  <navMenu id="markdown" label="导出/导入 Markdown ▾" v-slot="{ close }">
    <exportChapterItem @done="close" />
    <exportVolumeItem @done="close" />
    <importMarkdownItem @done="close" />
  </navMenu>
</template>
