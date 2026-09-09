<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor?: Editor
  tick: number
  extraCanUndo?: boolean
  extraCanRedo?: boolean
}>()

const isActive = (name: string, attrs?: Record<string, unknown>) => {
  void props.tick
  if (!props.editor) return false
  return attrs ? props.editor.isActive(name, attrs) : props.editor.isActive(name)
}

const emit = defineEmits<{
  toggleFind: []
  undo: []
  redo: []
}>()

const editorCanUndo = () => {
  void props.tick
  return Boolean(props.editor?.isEditable && props.editor.can().undo())
}

const editorCanRedo = () => {
  void props.tick
  return Boolean(props.editor?.isEditable && props.editor.can().redo())
}

const undoEnabled = () => editorCanUndo() || Boolean(props.extraCanUndo)
const redoEnabled = () => editorCanRedo() || Boolean(props.extraCanRedo)

const handleUndo = () => {
  emit('undo')
}

const handleRedo = () => {
  emit('redo')
}

const run = (command: () => void) => {
  if (!props.editor?.isEditable) return
  command()
}
</script>

<template>
  <div class="toolbar" @mousedown.prevent>
    <button
      type="button"
      title="撤销"
      :disabled="!undoEnabled()"
      @click="handleUndo"
    >
      撤销
    </button>
    <button
      type="button"
      title="重做"
      :disabled="!redoEnabled()"
      @click="handleRedo"
    >
      重做
    </button>
    <span class="sep"></span>
    <button
      type="button"
      title="加粗 Ctrl+B"
      :class="{ isActive: isActive('bold') }"
      :disabled="!editor?.isEditable"
      @click="run(() => editor!.chain().focus().toggleBold().run())"
    >
      粗
    </button>
    <button
      type="button"
      title="斜体 Ctrl+I"
      :class="{ isActive: isActive('italic') }"
      :disabled="!editor?.isEditable"
      @click="run(() => editor!.chain().focus().toggleItalic().run())"
    >
      斜
    </button>
    <button
      type="button"
      title="删除线"
      :class="{ isActive: isActive('strike') }"
      :disabled="!editor?.isEditable"
      @click="run(() => editor!.chain().focus().toggleStrike().run())"
    >
      删
    </button>
    <span class="sep"></span>
    <button
      type="button"
      title="一级标题"
      :class="{ isActive: isActive('heading', { level: 1 }) }"
      :disabled="!editor?.isEditable"
      @click="run(() => editor!.chain().focus().toggleHeading({ level: 1 }).run())"
    >
      H1
    </button>
    <button
      type="button"
      title="二级标题"
      :class="{ isActive: isActive('heading', { level: 2 }) }"
      :disabled="!editor?.isEditable"
      @click="run(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())"
    >
      H2
    </button>
    <button
      type="button"
      title="三级标题"
      :class="{ isActive: isActive('heading', { level: 3 }) }"
      :disabled="!editor?.isEditable"
      @click="run(() => editor!.chain().focus().toggleHeading({ level: 3 }).run())"
    >
      H3
    </button>
    <span class="sep"></span>
    <button
      type="button"
      title="引用"
      :class="{ isActive: isActive('blockquote') }"
      :disabled="!editor?.isEditable"
      @click="run(() => editor!.chain().focus().toggleBlockquote().run())"
    >
      引用
    </button>
    <span class="sep"></span>
    <button type="button" title="查找替换 Ctrl+F" @click="emit('toggleFind')">查找</button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-height: 32px;
  padding: 3px 16px;
  border-bottom: 2px solid var(--border);
  background: var(--bg-chrome);
  flex-shrink: 0;
}
.sep {
  width: 1px;
  height: 14px;
  margin: 0 4px;
  background: var(--border-soft);
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
button.isActive {
  background: var(--bg-selected);
}
button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
