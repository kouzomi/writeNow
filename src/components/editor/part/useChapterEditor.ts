import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { useCatalogStore } from '@/stores/shelf'

export const useChapterEditor = () => {
  const store = useCatalogStore()
  let writingId: number | null = store.currentChapterId
  const uiTick = ref(0)
  const charCount = ref(0)
  const findOpen = ref(false)

  const toggleFind = () => {
    findOpen.value = !findOpen.value
  }

  const closeFind = () => {
    findOpen.value = false
  }

  const onFindKeydown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault()
      findOpen.value = true
    }
  }

  const bumpUi = () => {
    uiTick.value += 1
  }

  const refreshStats = (instance: { getText: () => string }) => {
    const text = instance.getText()
    charCount.value = text.replace(/\s/g, '').length
  }

  const isFocused = ref(false)

  const editor = useEditor({
    content: store.currentChapter?.content || '',
    editable: store.currentChapterId != null,
    extensions: [StarterKit],
    onFocus: () => {
      isFocused.value = true
    },
    onBlur: () => {
      isFocused.value = false
    },
    onUpdate: ({ editor }) => {
      if (writingId == null) return
      store.updateChapterContent(writingId, editor.getHTML())
      refreshStats(editor)
      bumpUi()
      store.markEditorEdit()
    },
    onSelectionUpdate: bumpUi,
    onTransaction: ({ editor }) => {
      refreshStats(editor)
    },
  })

  watch(
    [() => store.currentChapterId, editor],
    ([chapterId, instance]) => {
      if (!instance) return

      writingId = null
      const html = chapterId == null ? '' : store.findChapter(chapterId)?.content || ''
      instance.setEditable(chapterId != null)
      instance.commands.setContent(html, { emitUpdate: false })
      writingId = chapterId
      if (chapterId == null) isFocused.value = false
      refreshStats(instance)
      bumpUi()
    },
  )

  onMounted(() => window.addEventListener('keydown', onFindKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onFindKeydown))

  const gutterWidth = computed(() => (store.isMenueExpanded ? store.currentWidth : 0))
  const chapterName = computed(() => store.currentChapter?.name || '未选择章节')
  const showEmptyHint = computed(() => store.currentChapterId == null)
  const showStartHint = computed(
    () => store.currentChapterId != null && charCount.value === 0 && !isFocused.value,
  )

  return {
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
  }
}
