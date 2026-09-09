<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useCatalogStore } from '@/stores/shelf'
import type { Chapter } from '@/stores/shelf'

const props = defineProps<{
  catalogId: number
  chapter: Chapter
}>()

const store = useCatalogStore()
const editing = ref(false)
const draftName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

const previewText = computed(() => {
  const text = props.chapter.content.replace(/<[^>]+>/g, '').trim()
  return text.slice(0, 24) || '尚未开始写作'
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
  const message = store.isCard ? '确定删除这张卡片？' : '确定删除这个章节？'
  if (!confirm(message)) return
  store.deleteChapter(props.catalogId, props.chapter.id)
}

const onSelect = () => {
  store.selectChapter(props.chapter.id)
  if (store.isCard) store.bringChapterToFront(props.chapter.id)
}
</script>

<template>
  <div
    class="chapter"
    :class="{ text: store.isText, isChosen: store.currentChapterId === chapter.id }"
    @click.stop="onSelect"
    @dblclick.stop="startRename"
  >
    <div class="chapter-copy">
      <input
        v-if="editing"
        ref="nameInput"
        v-model="draftName"
        class="name-input"
        @click.stop
        @keydown.enter.prevent="commitRename"
        @keydown.escape.prevent="cancelRename"
        @blur="commitRename"
      />
      <label v-else class="title">{{ chapter.name }}</label>
      <label v-if="store.isText" class="summary">{{ previewText }}</label>
    </div>
    <button class="remove" @click.stop="handleDelete">×</button>
  </div>
</template>

<style scoped>
.chapter {
  width: 100%;
  height: 32px;
  flex-shrink: 0;
  overflow: hidden;
  background: transparent;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.chapter.text {
  height: 75px;
}
.chapter.isChosen {
  background: var(--bg-selected);
}
.chapter-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.title {
  padding-left: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.summary {
  font-size: 12px;
  padding-left: 25px;
  color: var(--text-muted);
}
.name-input {
  width: calc(100% - 20px);
  margin-left: 10px;
  height: 24px;
  border: 1px solid var(--bg-selected);
  border-radius: 4px;
  padding: 0 6px;
  font-size: 14px;
  box-sizing: border-box;
}
label {
  display: block;
  flex-shrink: 0;
  overflow: hidden;
}
.remove {
  height: 28px;
  width: 25px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  flex-shrink: 0;
}
</style>
