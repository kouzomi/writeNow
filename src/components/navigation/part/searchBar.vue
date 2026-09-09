<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCatalogStore } from '@/stores/shelf'
import { activeNavMenu } from './activeNavMenu'

const store = useCatalogStore()
const query = ref('')
const root = ref<HTMLElement | null>(null)

const isOpen = computed(() => activeNavMenu.value === 'search')
const hits = computed(() => store.searchHits(query.value))
const showPanel = computed(() => isOpen.value && query.value.trim().length > 0)

const openPanel = () => {
  if (query.value.trim()) activeNavMenu.value = 'search'
}

const closePanel = () => {
  if (activeNavMenu.value === 'search') activeNavMenu.value = null
}

const openHit = (hit: { mode: 'text' | 'card'; catalogId: number; chapterId: number }) => {
  store.revealChapter(hit.mode, hit.catalogId, hit.chapterId)
  closePanel()
}

const onEnter = () => {
  const first = hits.value[0]
  if (first) openHit(first)
}

const onPointerDown = (event: PointerEvent) => {
  const target = event.target
  if (!(target instanceof Node)) return
  if (root.value && !root.value.contains(target)) closePanel()
}

onMounted(() => window.addEventListener('pointerdown', onPointerDown))
onUnmounted(() => window.removeEventListener('pointerdown', onPointerDown))
</script>

<template>
  <div ref="root" class="search">
    <input
      v-model="query"
      class="search-input"
      type="search"
      placeholder="搜索章节、卡片"
      @focus="openPanel"
      @input="openPanel"
      @keydown.escape.prevent="closePanel"
      @keydown.enter.prevent="onEnter"
    />
    <div v-if="showPanel" class="results">
      <button
        v-for="hit in hits"
        :key="`${hit.mode}-${hit.chapterId}`"
        type="button"
        class="hit"
        @click="openHit(hit)"
      >
        <div class="hit-top">
          <span class="kind">{{ hit.mode === 'card' ? '卡片' : '章节' }}</span>
          <span class="path">{{ hit.catalogName }} / {{ hit.chapterName }}</span>
        </div>
        <div class="snippet">{{ hit.snippet }}</div>
      </button>
      <div v-if="hits.length === 0" class="empty">没有匹配的章节或卡片</div>
    </div>
  </div>
</template>

<style scoped>
.search {
  position: relative;
  flex: 0 0 200px;
  width: 200px;
}
.search-input {
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  font-size: 13px;
}
.search-input::placeholder {
  color: var(--text-hint);
}
.results {
  position: absolute;
  top: calc(100% + 4px);
  left: auto;
  right: 0;
  width: 300px;
  z-index: 200;
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
.hit {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid var(--border-soft);
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}
.hit:last-child {
  border-bottom: none;
}
.hit:hover {
  background: var(--bg-hover);
}
.hit-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.kind {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted);
}
.path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.snippet {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: 12px;
}
.empty {
  padding: 12px;
  color: var(--text-hint);
  font-size: 13px;
}
</style>
