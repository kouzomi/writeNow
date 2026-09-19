<script setup lang="ts">
import { useCatalogStore } from '@/stores/shelf'
import { isMobile } from '@/utils/mobile'
import sideContainer from './part/sideContainer.vue'
import sideNavi from './part/sideNavi.vue'
import sideToggle from './part/sideToggle.vue'
import SideTool from './part/sideTool.vue'

const store = useCatalogStore()

const onResizePointerDown = (event: PointerEvent) => {
  if (isMobile.value) return
  if (!store.isMenueExpanded || event.button !== 0) return
  event.preventDefault()
  store.isMenueResizing = true
  const startX = event.clientX
  const startWidth = store.currentWidth

  const onMove = (moveEvent: PointerEvent) => {
    store.setSidebarWidth(startWidth + moveEvent.clientX - startX)
  }

  const onUp = () => {
    store.isMenueResizing = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

const closeDrawer = () => {
  if (isMobile.value) store.isMenueExpanded = false
}
</script>

<template>
  <div
    v-if="isMobile && store.isMenueExpanded"
    class="backdrop"
    @click="closeDrawer"
  ></div>
  <div
    class="sidebar-wrapper"
    :class="{ collapsed: !store.isMenueExpanded, mobile: isMobile }"
  >
    <div
      class="container"
      :class="{ collapsed: !store.isMenueExpanded, resizing: store.isMenueResizing }"
      :style="{
        width: store.isMenueExpanded
          ? isMobile
            ? 'min(86vw, 320px)'
            : store.currentWidth + 'px'
          : '0px',
      }"
    >
      <sideNavi></sideNavi>
      <SideTool></SideTool>
      <sideContainer></sideContainer>
      <div
        v-if="store.isMenueExpanded && !isMobile"
        class="resize-handle"
        title="拖动调节宽度"
        @pointerdown="onResizePointerDown"
      ></div>
    </div>
    <sideToggle />
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 90;
  background: rgba(0, 0, 0, 0.35);
}
.sidebar-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 100;
  display: flex;
  align-items: flex-start;
}
.sidebar-wrapper.mobile {
  padding-bottom: env(safe-area-inset-bottom);
}
.container {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-self: stretch;
  overflow: hidden;
  box-sizing: border-box;
  height: 100%;
  background-color: var(--bg-chrome);
  border-right: solid 2px var(--border);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.container.collapsed {
  border-right: none;
}
.container.resizing {
  transition: none;
}
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  z-index: 2;
  cursor: ew-resize;
}
</style>
