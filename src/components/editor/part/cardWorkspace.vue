<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useCatalogStore } from '@/stores/shelf'
import { useChapterEditor } from './useChapterEditor'
import editorFindBar from './editorFindBar.vue'
import editorToolbar from './editorToolbar.vue'
import cardBoard from './cardBoard.vue'

const store = useCatalogStore()
const { editor, uiTick, findOpen, gutterWidth, toggleFind, closeFind } = useChapterEditor()

const selectFoundCard = (id: number) => {
  store.selectChapter(id)
  store.bringChapterToFront(id)
}

const editorCanUndo = () => Boolean(editor.value?.isEditable && editor.value.can().undo())
const editorCanRedo = () => Boolean(editor.value?.isEditable && editor.value.can().redo())

const handleUndo = () => {
  if (store.shouldUndoBoard(editorCanUndo())) {
    store.undoBoard()
    return
  }
  if (editorCanUndo()) {
    editor.value?.chain().focus().undo().run()
    return
  }
  store.undoBoard()
}

const handleRedo = () => {
  if (store.shouldRedoBoard(editorCanRedo())) {
    store.redoBoard()
    return
  }
  if (editorCanRedo()) {
    editor.value?.chain().focus().redo().run()
    return
  }
  store.redoBoard()
}

const onKeydown = (event: KeyboardEvent) => {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
  const target = event.target as HTMLElement | null
  if (target?.closest('input,textarea')) return
  event.preventDefault()
  event.stopPropagation()
  if (event.shiftKey) handleRedo()
  else handleUndo()
}

onMounted(() => window.addEventListener('keydown', onKeydown, true))
onUnmounted(() => window.removeEventListener('keydown', onKeydown, true))
</script>

<template>
  <div class="editor-shell">
    <editorToolbar
      :editor="editor"
      :tick="uiTick"
      :extra-can-undo="store.canUndoBoard"
      :extra-can-redo="store.canRedoBoard"
      @toggle-find="toggleFind"
      @undo="handleUndo"
      @redo="handleRedo"
    />
    <editorFindBar
      v-if="findOpen"
      :editor="editor"
      :volume-chapters="store.currentCatalog?.charpterList"
      :current-chapter-id="store.currentChapterId"
      :select-chapter="selectFoundCard"
      :write-chapter="store.updateChapterContent"
      @close="closeFind"
    />
    <div class="workspace">
      <div class="gutter" :class="{ instant: store.isMenueResizing }" :style="{ width: gutterWidth + 'px' }"></div>
      <cardBoard :editor="editor" />
    </div>
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
</style>
