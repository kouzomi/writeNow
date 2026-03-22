<script setup lang="ts">
import sideContainer from './part/sideContainer.vue'
import sideNavi from './part/sideNavi.vue'
import SideTool from './part/sideTool.vue'
import { useCatalogStore } from '@/stores/shelf'

const store = useCatalogStore()
</script>

<template>
  <div class="sidebar-wrapper" :class="{ collapsed: !store.isMenueExpanded }">
    <div class="container">
      <sideNavi></sideNavi>
      <SideTool></SideTool>
      <sideContainer></sideContainer>
    </div>

    <button class="toggle-btn" :class="{ isChosen: store.isMenueExpanded }" @click="store.toggleMenueExpand">
      {{ store.isMenueExpanded ? '◀' : '▶' }}
    </button>
  </div>
</template>

<style scoped>
.sidebar-wrapper {
  position: relative;
  display: flex;
  height: 100%;
  width: 275px;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 平滑过渡 */
  z-index: 100;
  background-color: #F5F7FA;
  border-right: solid 2px black;
}

.collapsed {
  transform: translateX(-275px);
}
.container {
  display: flex; /* 修正：position: flex 是无效的，应为 display: flex */
  flex-direction: column;
  flex-shrink: 0;
  width: 100%;
  height: 100%;
}
.toggle-btn {
  position: absolute;
  right: -42px; /* 让他悬浮在侧边栏右侧边缘外 */
  width: 40px;
  height: 40px;
  background: #F5F7FA;
  cursor: pointer;
  font-size: 12px;
  border-right:solid 2px black;
  border-bottom: solid 2px black;
  border-top: none;
  border-left: none;
}
</style>
