<script setup lang="ts">
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { watch } from 'vue'
import { useNotebookStore } from '@/stores/notebook'

const store = useNotebookStore()
let applyingStore = false

const editor = useEditor({
  extensions: [Document, Paragraph, Text],
  content: store.textContent || '',
  onUpdate: ({ editor }) => {
    if (applyingStore) return
    store.textContent = editor.getHTML()
  },
})

watch(
  [() => store.textContent, editor],
  () => {
    const instance = editor.value
    if (!instance) return
    const next = store.textContent || ''
    if (instance.getHTML() === next) return
    applyingStore = true
    instance.commands.setContent(next, { emitUpdate: false })
    applyingStore = false
  },
)
</script>

<template>
  <editor-content :editor="editor" class="text-editor" />
</template>

<style scoped>
.text-editor {
  position: relative;
  width: 100%;
  height: 100%;
  font-size: 15px;
  text-align: left;
  overflow-y: auto;
  overflow-x: hidden;
  cursor: text;
  user-select: text;
}

.text-editor :deep(.ProseMirror) {
  outline: none;
  min-height: 100%;
  padding: 12px;
  line-height: 1.6;
  cursor: text;
  color: var(--text);
}
</style>
