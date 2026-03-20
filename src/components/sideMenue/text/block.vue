<script setup lang="ts">
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

interface text {
  id: number
  name: string
}
const list = ref<text[]>([])
const count = ref(0)
const creat = () => {
  list.value.push({ id: count.value, name: '' })
  count.value++
}
const _delete = () => {
  list.value.pop()
  count.value--
}
</script>

<template>
  <div class="menue">
    <div class="navi">
      <button @click="creat">新建文章</button>
      <button @click="_delete">删除文章</button>
    </div>
    <VueDraggable ref="el" v-model="list">
      <div v-for="item in list" :key="item.id" class="text">
        {{ item.id }}
      </div>
    </VueDraggable>
  </div>
</template>

<style scoped>
.block {
  border: 2px solid black; /* 上 solid、下 solid、左右 none */
  height: auto;
  width: 100%;
  position: relative;
}
.navi {
  position: relative;
  display: flex;
  height: 40px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  border-bottom: solid 1px #ddd;
  padding: 0 12px;
  background: #f5f5f5;
  flex-shrink: 0;
}
.text {
  border: 2px solid black;
  height: 60px;
  width: 100%;
  position: relative;
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
