<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { activeNavMenu } from './activeNavMenu'

const props = defineProps<{
  id: string
  label: string
}>()

const root = ref<HTMLElement | null>(null)
const isOpen = computed(() => activeNavMenu.value === props.id)

const toggle = () => {
  activeNavMenu.value = isOpen.value ? null : props.id
}

const close = () => {
  if (activeNavMenu.value === props.id) activeNavMenu.value = null
}

const onPointerDown = (event: PointerEvent) => {
  const target = event.target
  if (!(target instanceof Node)) return
  if (root.value && !root.value.contains(target)) close()
}

onMounted(() => window.addEventListener('pointerdown', onPointerDown))
onUnmounted(() => window.removeEventListener('pointerdown', onPointerDown))

defineExpose({ close })
</script>

<template>
  <div ref="root" class="menu">
    <button type="button" @click.stop="toggle">{{ label }}</button>
    <div v-if="isOpen" class="menu-list">
      <slot :close="close" />
    </div>
  </div>
</template>

<style scoped>
.menu {
  position: relative;
}
.menu > button,
.menu-list :deep(button) {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
}
.menu-list {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  min-width: 160px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.menu-list :deep(button) {
  height: 34px;
  border: none;
  border-bottom: 1px solid var(--border-soft);
  text-align: left;
}
.menu-list :deep(button:last-child) {
  border-bottom: none;
}
.menu-list :deep(button:hover) {
  background: var(--bg-hover);
}
.menu-list :deep(.panel button) {
  height: 24px;
  width: auto;
  border: 1px solid var(--border);
  text-align: center;
}
</style>
