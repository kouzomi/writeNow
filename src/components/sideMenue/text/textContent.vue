<script setup lang="ts">
import { child, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import navigation from './textNavigation.vue';
import block from './block.vue';

interface menue {
  id: number
  name: string
}


const list = ref<menue[]>([])
const count = ref(0)


const creatNewBlock = () => {
  list.value.push({id: count.value, name:''})
  count.value ++
}
const deleteOldBlock = () => {
  list.value.pop()
  count.value --
}

</script>

<template>
  <navigation @new-content="creatNewBlock" @delete-content="deleteOldBlock">
  </navigation>

  <div class="scroll-wrapper">
    <VueDraggable ref="el" v-model="list">
      <block v-for="item in list" :key="item.id"></block>
    </VueDraggable>
  </div>

</template>

<style scoped>

.scroll-wrapper {
  height: 100%;
  width: 100%;
  flex: 1;                    /* 占满剩余高度 */
  overflow-y: auto;           /* 关键！内部滚动 */
  background: #fff;
}
.scroll-wrapper::-webkit-scrollbar {
  width: 8px;                 /* 让滚动条变细 */
}

.scroll-wrapper::-webkit-scrollbar-track {
  background: transparent;    /* 轨道透明 */
  border-radius: 4px;
}
.scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(198, 188, 188, 0.2);   /* 半透明灰色 */
  border-radius: 4px;
}
</style>