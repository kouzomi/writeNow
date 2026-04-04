<script setup lang="ts">
import sideContainer from './part/sideContainer.vue'
import sideNavi from './part/sideNavi.vue'
import SideTool from './part/sideTool.vue'
import { useCatalogStore } from '@/stores/shelf'

const store = useCatalogStore()
</script>

<template>
  <div class="sidebar-wrapper">
    <div class="container" :class="{ collapsed: !store.isMenueExpanded }">
      <sideNavi></sideNavi>
      <SideTool></SideTool>
      <sideContainer></sideContainer>
    </div>
    <div class="side">
      <button
        class="toggle-btn"
        :class="{ isChosen: store.isMenueExpanded }"
        @click="store.toggleMenueExpand"
      >
        {{ store.isMenueExpanded ? '◀' : '▶' }}
      </button>
      <div></div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-wrapper {
  position: relative;
  display: flex;
  height: 100%;
  flex-shrink: 0;
  z-index: 100;
}
.container {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  width: 275px;
  height: 100%;
  background-color: #f5f7fa;
  border-right: solid black 2px;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapsed {
  width: 0px;
}
.side {
  width: 40px;
  height: 100%;
  background: transparent;
}
.toggle-btn {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #f5f7fa;
  cursor: pointer;
  font-size: 12px;
  border-right: solid 2px black;
  border-bottom: solid 2px black;
  border-top: none;
  border-left: none;
}
</style>
