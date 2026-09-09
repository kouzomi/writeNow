<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import {
  collectMatches,
  collectVolumeMatches,
  replaceAllInVolume,
  replaceAllMatches,
  replaceMatch,
  selectMatch,
  type LocatedMatch,
  type TextMatch,
} from '@/utils/findReplace'
import type { Chapter } from '@/stores/shelf'

const props = defineProps<{
  editor?: Editor
  volumeChapters?: Chapter[]
  currentChapterId?: number | null
  selectChapter?: (id: number) => void
  writeChapter?: (id: number, html: string) => void
}>()

const emit = defineEmits<{
  close: []
}>()

const query = ref('')
const replacement = ref('')
const located = ref<LocatedMatch[]>([])
const localMatches = ref<TextMatch[]>([])
const activeIndex = ref(-1)
const queryInput = ref<HTMLInputElement | null>(null)
const volumeMode = computed(() => props.volumeChapters != null)

const matchCount = computed(() =>
  volumeMode.value ? located.value.length : localMatches.value.length,
)

const live = computed(() => {
  if (!props.editor || props.currentChapterId == null) return undefined
  return { chapterId: props.currentChapterId, editor: props.editor }
})

const collect = () => {
  if (!query.value) {
    located.value = []
    localMatches.value = []
    activeIndex.value = -1
    return
  }
  if (volumeMode.value) {
    located.value = collectVolumeMatches(props.volumeChapters ?? [], query.value, live.value)
    localMatches.value = []
  } else if (props.editor) {
    localMatches.value = collectMatches(props.editor, query.value)
    located.value = []
  } else {
    located.value = []
    localMatches.value = []
    activeIndex.value = -1
  }
}

const revealLocal = () => {
  if (!props.editor || localMatches.value.length === 0) return
  const current = localMatches.value[activeIndex.value]
  if (current) selectMatch(props.editor, current)
}

const revealVolume = async () => {
  const current = located.value[activeIndex.value]
  if (!current) return
  if (current.chapterId !== props.currentChapterId) {
    props.selectChapter?.(current.chapterId)
    await nextTick()
    await nextTick()
  }
  if (props.editor) selectMatch(props.editor, current.match)
}

const refreshMatches = async (selectFirst = false) => {
  collect()
  const total = matchCount.value
  if (total === 0) {
    activeIndex.value = -1
    return
  }
  if (selectFirst || activeIndex.value < 0 || activeIndex.value >= total) {
    activeIndex.value = 0
  }
  if (volumeMode.value) await revealVolume()
  else revealLocal()
}

const go = async (step: number) => {
  const total = matchCount.value
  if (total === 0) return
  activeIndex.value = (activeIndex.value + step + total) % total
  if (volumeMode.value) await revealVolume()
  else revealLocal()
}

const handleReplace = async () => {
  if (activeIndex.value < 0) return
  if (volumeMode.value) {
    const current = located.value[activeIndex.value]
    if (!current) return
    await revealVolume()
    if (props.editor) replaceMatch(props.editor, current.match, replacement.value)
  } else {
    if (!props.editor) return
    const current = localMatches.value[activeIndex.value]
    if (!current) return
    replaceMatch(props.editor, current, replacement.value)
  }
  await refreshMatches()
}

const handleReplaceAll = async () => {
  if (matchCount.value === 0) return
  if (volumeMode.value) {
    replaceAllInVolume(
      props.volumeChapters ?? [],
      query.value,
      replacement.value,
      live.value,
      props.writeChapter,
    )
  } else if (props.editor) {
    replaceAllMatches(props.editor, localMatches.value, replacement.value)
  }
  await refreshMatches()
}

watch(query, () => {
  void refreshMatches(true)
})

watch(
  () => props.volumeChapters?.map((chapter) => chapter.id).join(','),
  () => {
    if (volumeMode.value && query.value) void refreshMatches(true)
  },
)

watch(
  () => props.editor,
  () => {
    void nextTick(() => queryInput.value?.focus())
  },
  { immediate: true },
)

const canReplace = computed(() => {
  if (matchCount.value === 0 || activeIndex.value < 0) return false
  if (volumeMode.value) return true
  return Boolean(props.editor?.isEditable)
})
</script>

<template>
  <div class="find-bar">
    <input
      ref="queryInput"
      v-model="query"
      type="text"
      :placeholder="volumeMode ? '查找本组' : '查找'"
      @keydown.enter.prevent="go(1)"
      @keydown.escape.prevent="emit('close')"
    />
    <input
      v-model="replacement"
      type="text"
      placeholder="替换为"
      @keydown.enter.prevent="handleReplace"
      @keydown.escape.prevent="emit('close')"
    />
    <span class="count">{{ matchCount ? `${activeIndex + 1}/${matchCount}` : '0/0' }}</span>
    <button type="button" :disabled="matchCount === 0" @click="go(-1)">上一个</button>
    <button type="button" :disabled="matchCount === 0" @click="go(1)">下一个</button>
    <button type="button" :disabled="!canReplace" @click="handleReplace">替换</button>
    <button type="button" :disabled="!canReplace" @click="handleReplaceAll">全部替换</button>
    <button type="button" @click="emit('close')">关闭</button>
  </div>
</template>

<style scoped>
.find-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 4px 12px;
  border-bottom: 1px solid var(--border-soft);
  background: var(--bg-chrome-2);
  flex-shrink: 0;
}
input {
  width: 140px;
  height: 24px;
  box-sizing: border-box;
  padding: 0 6px;
  border: 1px solid var(--border);
  color: var(--text);
  background: var(--bg-surface);
  font-size: 12px;
}
.count {
  min-width: 48px;
  color: var(--text-muted);
  font-size: 12px;
}
button {
  height: 24px;
  padding: 0 7px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
}
button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
