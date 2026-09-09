<script setup lang="ts">
import { computed } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'
import { useSettingsStore } from '@/stores/settings'
import { useCatalogStore } from '@/stores/shelf'

defineProps<{
  editor?: Editor
  gutterWidth: number
  chapterName: string
  charCount: number
  showEmptyHint: boolean
  showStartHint: boolean
}>()

const settings = useSettingsStore()
const catalog = useCatalogStore()
const fontSizePx = computed(() => `${settings.fontSize}px`)
</script>

<template>
  <div class="workspace">
    <div class="gutter" :class="{ instant: catalog.isMenueResizing }" :style="{ width: gutterWidth + 'px' }"></div>
    <div class="writing">
      <div class="editor-body">
        <editor-content :editor="editor" class="tiptap-editor" />
        <div v-if="showEmptyHint" class="empty-hint">从左侧选择一个章节开始写作</div>
        <div v-else-if="showStartHint" class="start-hint">开始写作…</div>
      </div>
      <div class="status">
        <span>{{ chapterName }}</span>
        <span>{{ charCount }} 字</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.gutter {
  flex-shrink: 0;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.gutter.instant {
  transition: none;
}
.writing {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.editor-body {
  position: relative;
  flex: 1;
  min-height: 0;
}
.tiptap-editor {
  width: 100%;
  height: 100%;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
.tiptap-editor :deep(.ProseMirror) {
  outline: none !important;
  min-height: 100%;
  box-sizing: border-box;
  max-width: 720px;
  margin: 0 auto;
  font-size: v-bind(fontSizePx);
  line-height: 1.75;
  padding: 28px 24px 48px;
  color: var(--text);
}
.start-hint {
  position: absolute;
  top: 28px;
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, 100%);
  box-sizing: border-box;
  padding: 0 24px;
  color: var(--text-hint);
  font-size: v-bind(fontSizePx);
  line-height: 1.75;
  pointer-events: none;
}
.tiptap-editor :deep(.ProseMirror h1) {
  font-size: 1.8em;
  margin: 0.6em 0 0.4em;
}
.tiptap-editor :deep(.ProseMirror h2) {
  font-size: 1.4em;
  margin: 0.8em 0 0.35em;
}
.tiptap-editor :deep(.ProseMirror h3) {
  font-size: 1.15em;
  margin: 0.8em 0 0.3em;
}
.tiptap-editor :deep(.ProseMirror blockquote) {
  margin: 0.8em 0;
  padding-left: 12px;
  border-left: 3px solid var(--bg-selected);
  color: var(--text-muted);
}
.tiptap-editor :deep(.ProseMirror pre) {
  margin: 0.8em 0;
  padding: 12px;
  background: var(--bg-code);
  border-radius: 6px;
  overflow-x: auto;
  font-size: 14px;
}
.tiptap-editor :deep(.ProseMirror ul),
.tiptap-editor :deep(.ProseMirror ol) {
  padding-left: 1.4em;
}
.empty-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-hint);
  font-size: 15px;
  white-space: nowrap;
  pointer-events: none;
}
.status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  border-top: 1px solid var(--border-soft);
  background: var(--bg-chrome);
  color: var(--text-muted);
  font-size: 12px;
  flex-shrink: 0;
}
</style>
