<script setup lang="ts">
import { ref } from 'vue';
import textContent from './text/textContent.vue';

</script>

<template>
    <div class="container">
        <textContent></textContent>
    </div>
</template>

<style scoped>
.container {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 275px;
    border: 1px solid black;
    border-radius: 0;
    cursor: default;
}

</style>