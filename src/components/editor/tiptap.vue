<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const editor = useEditor({
  content: "<p>I'm running Tiptap with Vue.js. 🎉</p>",
  extensions: [StarterKit],
})
</script>

<template>
  <editor-content :editor="editor" class="tiptap-editor" />
</template>

<style scoped>
.tiptap-editor {
  width: 90%;
  height: 90%;
  background: transparent;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}

/* 关键：穿透到 ProseMirror 可编辑区域 */
.tiptap-editor :deep(.ProseMirror) {
  outline: none !important; /* 去掉默认焦点边框 */
  min-height: 180px;
  font-size: 16px;
  line-height: 1.6;
  padding: 12px;
}
</style>
