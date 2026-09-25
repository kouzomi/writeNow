<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { useCatalogStore, type CardSlot } from '@/stores/shelf'
import { SLOT_TEXT_MIN } from '@/utils/cardLayout'
import cardItem from './cardItem.vue'

const props = defineProps<{
  frame: CardSlot
  catalogId: number
  chosen?: boolean
  selectedIds: number[]
  editor?: Editor
  currentChapterId: number | null
  labeling?: boolean
}>()

const emit = defineEmits<{
  select: []
  dragstart: [event: PointerEvent]
  resizestart: [event: PointerEvent]
  cardSelect: [id: number, event: PointerEvent]
  cardDrag: [id: number, event: PointerEvent]
  cardResize: [id: number, event: PointerEvent]
  cardLink: [id: number, event: PointerEvent]
}>()

const store = useCatalogStore()
const editing = ref(false)
const draft = ref('')
const titleInput = ref<HTMLTextAreaElement | null>(null)

const members = computed(() =>
  props.frame.cardIds.flatMap((id) => {
    const chapter = store.findChapter(id)
    return chapter ? [chapter] : []
  }),
)

const onSlotPointerDown = (event: PointerEvent) => {
  emit('select')
  if (editing.value || event.button !== 0) return
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('.card, button, .resize, textarea')) return
  emit('dragstart', event)
}

const startRename = async () => {
  editing.value = true
  draft.value = props.frame.title
  await nextTick()
  titleInput.value?.focus()
}

const removeSlot = () => {
  if (!confirm('确定删除这个卡槽？槽里的卡片会留在原地。')) return
  store.deleteSlot(props.frame.id)
}

const commitRename = () => {
  const title = draft.value.trim() || '未命名卡槽'
  store.renameSlot(props.frame.id, title)
  editing.value = false
}
</script>

<template>
  <div
    class="slot"
    :class="{ isChosen: chosen, isLabeling: labeling }"
    :style="{
      left: frame.x + 'px',
      top: frame.y + 'px',
      width: frame.width + 'px',
      height: frame.height + 'px',
    }"
    @pointerdown.stop="onSlotPointerDown"
  >
    <div class="title" :style="{ height: SLOT_TEXT_MIN + 'px' }" @dblclick.stop="startRename">
      <textarea
        v-if="editing"
        ref="titleInput"
        v-model="draft"
        @pointerdown.stop
        @keydown.escape.prevent="editing = false"
        @blur="commitRename"
      ></textarea>
      <p v-else>{{ frame.title }}</p>
    </div>
    <div class="body"></div>
    <cardItem
      v-for="chapter in members"
      :key="chapter.id"
      :catalog-id="catalogId"
      :chapter="chapter"
      :origin-x="frame.x"
      :origin-y="frame.y"
      :chosen="selectedIds.includes(chapter.id)"
      :editor="currentChapterId === chapter.id ? editor : undefined"
      @select="emit('cardSelect', chapter.id, $event)"
      @dragstart="emit('cardDrag', chapter.id, $event)"
      @resizestart="emit('cardResize', chapter.id, $event)"
      @linkstart="emit('cardLink', chapter.id, $event)"
    />
    <button type="button" class="remove" title="删除卡槽" @pointerdown.stop @click.stop="removeSlot">
      ×
    </button>
    <div class="resize" title="拖动改大小" @pointerdown.stop="emit('resizestart', $event)"></div>
  </div>
</template>

<style scoped>
.slot {
  position: absolute;
  z-index: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 0;
  background: transparent;
  overflow: hidden;
  cursor: grab;
}
.slot.isChosen {
  border-color: var(--bg-selected);
  background: transparent;
}
.slot.isLabeling,
.slot.isLabeling .title,
.slot.isLabeling .body {
  pointer-events: none;
}
.title {
  box-sizing: border-box;
  padding: 8px 28px 8px 10px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text);
}
.title p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: grab;
}
.title textarea {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 0;
  padding: 0;
  resize: none;
  font: inherit;
  line-height: inherit;
  color: inherit;
  background: transparent;
  outline: none;
  box-sizing: border-box;
}
.body {
  flex: 1;
}
.remove {
  position: absolute;
  top: 2px;
  right: 4px;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
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
