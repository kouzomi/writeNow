<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useCatalogStore, type BoardLabel } from '@/stores/shelf'

const props = defineProps<{
  label: BoardLabel
  chosen?: boolean
  autoEdit?: boolean
}>()

const emit = defineEmits<{
  select: []
  dragstart: [event: PointerEvent]
  edited: []
}>()

const store = useCatalogStore()
const editing = ref(false)
const draft = ref('')
const textInput = ref<HTMLTextAreaElement | null>(null)

const startEdit = async () => {
  editing.value = true
  draft.value = props.label.text
  await nextTick()
  textInput.value?.focus()
  textInput.value?.select()
}

const removeLabel = () => {
  if (!confirm('确定删除这段标注？')) return
  store.deleteLabel(props.label.id)
}

const commit = () => {
  store.editLabel(props.label.id, draft.value.trim() || '标注')
  editing.value = false
  emit('edited')
}

onMounted(() => {
  if (props.autoEdit) void startEdit()
})

watch(
  () => props.autoEdit,
  (value) => {
    if (value) void startEdit()
  },
)
</script>

<template>
  <div
    class="label"
    :class="{ isChosen: chosen }"
    :style="{ left: label.x + 'px', top: label.y + 'px', width: label.width + 'px' }"
    @pointerdown.stop="emit('select')"
    @dblclick.stop="startEdit"
  >
    <textarea
      v-if="editing"
      ref="textInput"
      v-model="draft"
      rows="2"
      @pointerdown.stop
      @keydown.enter.exact.prevent="commit"
      @keydown.escape.prevent="editing = false"
      @blur="commit"
    ></textarea>
    <p v-else @pointerdown.stop="emit('dragstart', $event)">{{ label.text }}</p>
    <button type="button" title="删除标注" @pointerdown.stop @click.stop="removeLabel">×</button>
  </div>
</template>

<style scoped>
.label {
  position: absolute;
  z-index: 2;
  box-sizing: border-box;
  min-height: 32px;
  padding: 6px 22px 6px 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: var(--bg-surface);
  color: var(--text);
  font-size: 13px;
  line-height: 1.4;
}
.label.isChosen {
  border-color: var(--bg-selected);
}
.label p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: grab;
}
.label textarea {
  width: 100%;
  border: none;
  resize: none;
  padding: 0;
  font: inherit;
  color: inherit;
  background: transparent;
  outline: none;
}
.label button {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
</style>
