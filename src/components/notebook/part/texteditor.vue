<script setup lang="ts">
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { useNotebookStore } from '@/stores/notebook'

const store = useNotebookStore()
const editor = useEditor({
    extensions: [
        Document,
        Paragraph,
        Text,
    ],
    content: `hello`
})
</script>

<template>
  <editor-content :editor="editor" class="text-editor" 
    :style="{ width: store.size.width - 50 + 'px',height: store.size.height - 60 + 'px',}"/>
</template>

<style scoped>

.text-editor {
  position: relative;
  width: 100px;
  font-size: 15px;
  text-align: left;    /* 强制左对齐，不受父级居中影响 */
}
.container {
  display: flex;
  justify-content: center;
}

</style>