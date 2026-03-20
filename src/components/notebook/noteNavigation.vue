<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  allowDrag: boolean
}>()
const emit = defineEmits(['dontDrag', 'dontExpand','cleanText'])

const movableTip = ref('已解锁')

watch(
  () => props.allowDrag,
  (newVal) => {
    movableTip.value = newVal ? '已解锁' : '已固定'
  },
  { immediate: true }, // 组件创建时立即同步一次
)
const close = () => {
  emit('dontExpand', false)
}
const clean = () => {
  emit('cleanText',true)
}
const isMovable = () => {
  //console.log('isMovable 被点击，当前 props.allowDrag =', props.allowDrag)

  const nextState = !props.allowDrag

  //console.log('即将 emit dontDrag 为', nextState)
  emit('dontDrag', nextState)
}
</script>

<template>
  <div class="navigation">
    <button @click="close">关闭</button>
    <button @click="clean">清空</button>
    <button>主题</button>
    <button @click="isMovable">{{ movableTip }}</button>
  </div>
</template>
<style scoped>
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
