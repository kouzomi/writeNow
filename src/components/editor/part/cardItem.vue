<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'
import { useCatalogStore, type Chapter } from '@/stores/shelf'
import { CARD_HEIGHT, CARD_TITLE_HEIGHT, CARD_WIDTH } from '@/utils/cardLayout'

const props = defineProps<{
  catalogId: number
  chapter: Chapter
  editor?: Editor
  chosen?: boolean
}>()

const emit = defineEmits<{
  select: [event: PointerEvent]
  dragstart: [event: PointerEvent]
  resizestart: [event: PointerEvent]
  linkstart: [event: PointerEvent]
}>()

const store = useCatalogStore()
const editing = ref(false)
const draftName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

const cardWidth = computed(() => props.chapter.size?.width ?? CARD_WIDTH)
const cardHeight = computed(() =>
  props.chapter.collapsed ? CARD_TITLE_HEIGHT : (props.chapter.size?.height ?? CARD_HEIGHT),
)
const selected = computed(() => props.chosen ?? store.currentChapterId === props.chapter.id)
const previewText = computed(() => {
  const text = props.chapter.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text || '空白卡片'
})

const startRename = async () => {
  editing.value = true
  draftName.value = props.chapter.name
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

const commitRename = () => {
  const name = draftName.value.trim()
  if (name) store.renameChapter(props.chapter.id, name)
  editing.value = false
}

const cancelRename = () => {
  editing.value = false
}

const handleDelete = () => {
  if (!confirm('确定删除这张卡片？')) return
  store.deleteChapter(props.catalogId, props.chapter.id)
}

const onSelect = (event: PointerEvent) => {
  emit('select', event)
}

const onTitlePointerDown = (event: PointerEvent) => {
  if (editing.value) return
  if ((event.target as HTMLElement).closest('input,button,.link-handle')) return
  emit('dragstart', event)
}

const onResizePointerDown = (event: PointerEvent) => {
  emit('resizestart', event)
}

const onLinkPointerDown = (event: PointerEvent) => {
  emit('linkstart', event)
}

const toggleCollapsed = () => {
  store.toggleChapterCollapsed(props.chapter.id)
}
</script>

<template>
  <div
    class="card"
    :class="{ isChosen: selected, isCollapsed: chapter.collapsed }"
    :style="{
      left: (chapter.pos?.x ?? 0) + 'px',
      top: (chapter.pos?.y ?? 0) + 'px',
      zIndex: chapter.zIndex ?? 1,
      width: cardWidth + 'px',
      height: cardHeight + 'px',
    }"
    @pointerdown.stop="onSelect"
    @dblclick.stop
  >
    <div class="title-bar" @pointerdown.stop="onTitlePointerDown" @dblclick.stop="startRename">
      <input
        v-if="editing"
        ref="nameInput"
        v-model="draftName"
        class="name-input"
        @click.stop
        @pointerdown.stop
        @keydown.enter.prevent="commitRename"
        @keydown.escape.prevent="cancelRename"
        @blur="commitRename"
      />
      <span v-else class="title">{{ chapter.name }}</span>
      <div
        class="link-handle"
        title="拖到另一张卡来连线"
        @pointerdown.stop="onLinkPointerDown"
      ></div>
      <button
        type="button"
        class="fold"
        :title="chapter.collapsed ? '展开' : '最小化'"
        @pointerdown.stop
        @click.stop="toggleCollapsed"
      >
        {{ chapter.collapsed ? '□' : '–' }}
      </button>
      <button type="button" class="remove" @pointerdown.stop @click.stop="handleDelete">×</button>
    </div>
    <div v-if="!chapter.collapsed" class="body">
      <editor-content v-if="selected && editor" :editor="editor" class="card-editor" />
      <div v-else class="preview">{{ previewText }}</div>
    </div>
    <div
      v-if="!chapter.collapsed"
      class="resize"
      title="拖动改大小"
      @pointerdown.stop="onResizePointerDown"
    ></div>
  </div>
</template>

<style scoped>
.card {
  position: absolute;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: var(--bg-surface);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.card.isChosen {
  border-color: var(--bg-selected);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.title-bar {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 4px 0 10px;
  background: var(--bg-chrome);
  cursor: grab;
  flex-shrink: 0;
  user-select: none;
}
.title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.name-input {
  flex: 1;
  min-width: 0;
  height: 22px;
  border: 1px solid var(--bg-selected);
  border-radius: 4px;
  padding: 0 6px;
  font-size: 13px;
  box-sizing: border-box;
}
.card.isCollapsed .title-bar {
  height: 100%;
}
.link-handle {
  width: 10px;
  height: 10px;
  margin: 0 4px;
  border-radius: 50%;
  background: var(--text-muted);
  cursor: crosshair;
  flex-shrink: 0;
}
.fold,
.remove {
  height: 24px;
  width: 24px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
}
.body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.preview {
  height: 100%;
  padding: 8px 10px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
}
.card-editor {
  height: 100%;
  overflow: auto;
  scrollbar-width: none;
}
.card-editor :deep(.ProseMirror) {
  outline: none !important;
  min-height: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
}
.resize {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, var(--border) 50%);
}
</style>
