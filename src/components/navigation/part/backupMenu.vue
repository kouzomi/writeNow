<script setup lang="ts">
import backupItem from './backupItem.vue'
import navMenu from './navMenu.vue'
import restoreItem from './restoreItem.vue'
</script>

<template>
  <navMenu id="backup" label="备份 / 恢复 ▾" v-slot="{ close }">
    <backupItem @done="close" />
    <restoreItem @done="close" />
  </navMenu>
</template>
