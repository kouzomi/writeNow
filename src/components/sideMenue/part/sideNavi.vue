<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'
const store = useCatalogStore()
</script>

<template>
  <div class="navi">
    <div class="state" :class="{ isChosen: store.isText }" @click="store.setViewMode('text')">文本</div>
    <div class="state" :class="{ isChosen: store.isCard }" @click="store.setViewMode('card')">卡片</div>
    <div class="state" :class="{ isChosen: store.isMap }" @click="store.setViewMode('map')">导图</div>
  </div>
</template>

<style scoped>
.navi {
  position: relative;
  display: flex;
  height: 40px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.state {
  height: 28px;
  width: 75px;
  border-radius: 7px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  overflow: hidden;
}
.isChosen {
  background: #a8cef8;
}
</style>