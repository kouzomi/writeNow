<script setup lang="ts">
import { ref } from 'vue';


const emit = defineEmits(['newContent','deleteContent'])

const creatContent =()=>{
    emit('newContent',true)
}
const deleteContent =()=>{
    emit('deleteContent',true)
}
</script>

<template>
    <div class="navigation">
        <button @click="creatContent">新建</button>
        <button @click="deleteContent">删除</button>
        
    </div>
</template>

<style scoped>
.navigation {
  position: relative;
  display: flex;
  height: 50px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-bottom: solid 1px #ddd;
  padding: 0 12px;
  background: #f5f5f5;
  flex-shrink: 0;
}
button {
  height: 28px;
  padding: 0 12px;
  border: 1px solid #ccc;
  border-radius: 14px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  overflow: hidden;
}
</style>