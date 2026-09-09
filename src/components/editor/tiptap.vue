<script setup lang="ts">
import { useChapterEditor } from './part/useChapterEditor'
import editorFindBar from './part/editorFindBar.vue'
import editorToolbar from './part/editorToolbar.vue'
import editorWorkspace from './part/editorWorkspace.vue'

const {
  editor,
  uiTick,
  charCount,
  findOpen,
  gutterWidth,
  chapterName,
  showEmptyHint,
  showStartHint,
  toggleFind,
  closeFind,
} = useChapterEditor()

const handleUndo = () => {
  if (!editor.value?.isEditable) return
  editor.value.chain().focus().undo().run()
}

const handleRedo = () => {
  if (!editor.value?.isEditable) return
  editor.value.chain().focus().redo().run()
}
</script>

<template>
  <div class="editor-shell">
    <editorToolbar
      :editor="editor"
      :tick="uiTick"
      @toggle-find="toggleFind"
      @undo="handleUndo"
      @redo="handleRedo"
    />
    <editorFindBar v-if="findOpen" :editor="editor" @close="closeFind" />
    <editorWorkspace
      :editor="editor"
      :gutter-width="gutterWidth"
      :chapter-name="chapterName"
      :char-count="charCount"
      :show-empty-hint="showEmptyHint"
      :show-start-hint="showStartHint"
    />
  </div>
</template>

<style scoped>
.editor-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}
</style>
