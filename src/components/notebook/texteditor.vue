<script setup lang="ts">
const emit = defineEmits(['mouseState'])

const startText =(e:PointerEvent) =>{
    console.log('start text')
}
</script>

<template>
    <textarea class="editor"
    @pointerdown.stop="startText" >
        
    </textarea>
</template>

<style scoped>
.editor {
    position: relative;
    z-index: 60;
    width: 100%;
    height: 100%;
    font-size: 16px;
    line-height: normal;
    background: yellow;
    border: none;
    outline: solid blue 2px;
    /*background: transparent;*/
}
</style>