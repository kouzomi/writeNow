<script setup lang="ts">
import { computed } from 'vue'
import { useNotebookStore } from '@/stores/notebook'

const store = useNotebookStore()
const movableTip = computed(() => store.allowDrag ? '已解锁' : '已固定')

const handleToggleDrag = () =>{
  console.log(store.allowDrag)
  store.setAllowDrag(!store.allowDrag)
  console.log(store.allowDrag)
}
const handleToggleClose = () =>{
  store.toggleExpand(false)
  //store.allowDrag = true
}
</script>

<template>
  <div class="navigation">
    <button @click="handleToggleClose">关闭</button>
    <button @click="store.clearContent">清空</button>
    <button>主题</button>
    <button @click="handleToggleDrag">{{ movableTip }}</button>
  </div>
</template>

<style scoped>
button {
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  overflow: hidden;
  flex-shrink: 0
}
.navigation {
  position: relative;
  z-index: 100;
  display: flex;
  height: 50px;
  flex-direction: row-reverse;
  align-items: center;
  gap: 10px;
  border-bottom: solid 1px #ddd;
  padding: 0 12px;
  background: #f5f5f5;
  flex-shrink: 0;
}
</style>
