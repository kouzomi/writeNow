<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { CARD_CANVAS_HEIGHT, CARD_CANVAS_WIDTH } from '@/utils/cardLayout'
import { useCardBoard } from './useCardBoard'
import cardItem from './cardItem.vue'

defineProps<{
  editor?: Editor
}>()

const {
  store,
  viewportRef,
  canvasRef,
  catalog,
  cards,
  selectedLink,
  draftPath,
  linkPaths,
  addCard,
  beginDrag,
  beginResize,
  beginLink,
  selectLink,
  onCanvasPointerDown,
  onCanvasDblClick,
} = useCardBoard()
</script>

<template>
  <div class="board">
    <div class="board-bar">
      <span class="volume">{{ catalog?.name || '未选择组' }}</span>
      <span class="count">{{ catalog ? `${cards.length} 张卡片` : '' }}</span>
      <button type="button" :disabled="!catalog" @click="addCard()">新建卡片</button>
    </div>
    <div
      ref="viewportRef"
      class="viewport"
      @pointerdown="onCanvasPointerDown"
    >
      <div
        v-if="catalog"
        ref="canvasRef"
        class="canvas"
        :style="{ width: CARD_CANVAS_WIDTH + 'px', height: CARD_CANVAS_HEIGHT + 'px' }"
        @dblclick="onCanvasDblClick"
      >
        <svg class="links" :width="CARD_CANVAS_WIDTH" :height="CARD_CANVAS_HEIGHT">
          <defs>
            <marker
              id="card-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          <g
            v-for="link in linkPaths"
            :key="`${link.from}-${link.to}`"
            class="link"
            :class="{ isChosen: selectedLink?.from === link.from && selectedLink?.to === link.to }"
            @pointerdown.stop="selectLink(link.from, link.to)"
          >
            <line
              class="hit"
              :x1="link.x1"
              :y1="link.y1"
              :x2="link.x2"
              :y2="link.y2"
            />
            <line
              class="line"
              :x1="link.x1"
              :y1="link.y1"
              :x2="link.x2"
              :y2="link.y2"
              marker-end="url(#card-arrow)"
            />
          </g>
          <line
            v-if="draftPath"
            class="line draft"
            :x1="draftPath.x1"
            :y1="draftPath.y1"
            :x2="draftPath.x2"
            :y2="draftPath.y2"
            marker-end="url(#card-arrow)"
          />
        </svg>
        <cardItem
          v-for="item in cards"
          :key="item.id"
          :catalog-id="catalog.id"
          :chapter="item"
          :editor="store.currentChapterId === item.id ? editor : undefined"
          @dragstart="beginDrag(item.id, $event)"
          @resizestart="beginResize(item.id, $event)"
          @linkstart="beginLink(item.id, $event)"
        />
      </div>
      <div v-if="!catalog" class="empty-hint">从左侧选择一个组，再在白板上放卡片</div>
      <div v-else-if="cards.length === 0" class="empty-hint">双击空白处或点「新建卡片」</div>
    </div>
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.board-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 32px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--bg-chrome);
  flex-shrink: 0;
}
.volume {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.count {
  color: var(--text-muted);
  font-size: 12px;
}
.board-bar button {
  margin-left: auto;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
}
.board-bar button:disabled {
  opacity: 0.4;
  cursor: default;
}
.viewport {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--bg-chrome-2);
}
.canvas {
  position: relative;
  background-image: radial-gradient(var(--border-soft) 1px, transparent 1px);
  background-size: 24px 24px;
}
.links {
  position: absolute;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  overflow: visible;
  color: var(--text-muted);
}
.link {
  cursor: pointer;
}
.link.isChosen {
  color: var(--bg-selected);
}
.hit {
  fill: none;
  stroke: transparent;
  stroke-width: 12;
  pointer-events: stroke;
}
.line {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}
.line.draft {
  pointer-events: none;
  stroke-dasharray: 6 4;
}
.empty-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-32px);
  color: var(--text-hint);
  font-size: 15px;
  pointer-events: none;
}
</style>
