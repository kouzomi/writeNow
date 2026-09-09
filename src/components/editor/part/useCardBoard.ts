import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useCatalogStore } from '@/stores/shelf'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  boxAnchorToward,
  cardBox,
  clampCardPos,
  pointInBox,
} from '@/utils/cardLayout'

export const useCardBoard = () => {
  const store = useCatalogStore()
  const viewportRef = ref<HTMLElement | null>(null)
  const canvasRef = ref<HTMLElement | null>(null)
  const selectedLink = ref<{ from: number; to: number } | null>(null)
  const draft = ref<{ from: number; x: number; y: number } | null>(null)

  const catalog = computed(() => store.currentCatalog)
  const cards = computed(() => catalog.value?.charpterList ?? [])

  watch(
    () => [store.currentChapterId, viewportRef.value] as const,
    async ([id]) => {
      if (id != null) selectedLink.value = null
      if (id == null) return
      await nextTick()
      const chapter = cards.value.find((item) => item.id === id)
      const viewport = viewportRef.value
      if (!chapter || !viewport) return
      const box = cardBox(chapter)
      const pad = 32
      const viewLeft = viewport.scrollLeft
      const viewTop = viewport.scrollTop
      const viewRight = viewLeft + viewport.clientWidth
      const viewBottom = viewTop + viewport.clientHeight
      const visible =
        box.x >= viewLeft + pad &&
        box.y >= viewTop + pad &&
        box.x + box.width <= viewRight - pad &&
        box.y + box.height <= viewBottom - pad
      if (visible) return
      viewport.scrollTo({
        left: Math.max(0, box.x - pad),
        top: Math.max(0, box.y - pad),
      })
    },
  )

  watch(
    () => [store.currentCatalogId, cards.value.length] as const,
    () => {
      if (store.currentCatalogId == null || !store.isCard) return
      store.ensureCardLayout(store.currentCatalogId)
      selectedLink.value = null
    },
    { immediate: true },
  )

  const canvasPoint = (event: PointerEvent | MouseEvent) => {
    if (!canvasRef.value) return { x: 0, y: 0 }
    const rect = canvasRef.value.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const cardAtPoint = (x: number, y: number, exceptId?: number) => {
    const ordered = [...cards.value].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
    return ordered.find((chapter) => {
      if (chapter.id === exceptId) return false
      return pointInBox(x, y, cardBox(chapter))
    })
  }

  const linkPaths = computed(() => {
    const links = catalog.value?.links ?? []
    return links.flatMap((link) => {
      const from = cards.value.find((chapter) => chapter.id === link.from)
      const to = cards.value.find((chapter) => chapter.id === link.to)
      if (!from || !to) return []
      const start = boxAnchorToward(cardBox(from), cardBox(to))
      const end = boxAnchorToward(cardBox(to), cardBox(from))
      return [{ from: link.from, to: link.to, x1: start.x, y1: start.y, x2: end.x, y2: end.y }]
    })
  })

  const draftPath = computed(() => {
    if (!draft.value) return null
    const from = cards.value.find((chapter) => chapter.id === draft.value?.from)
    if (!from) return null
    const start = boxAnchorToward(cardBox(from), {
      x: draft.value.x,
      y: draft.value.y,
      width: 1,
      height: 1,
    })
    return { x1: start.x, y1: start.y, x2: draft.value.x, y2: draft.value.y }
  })

  const addCard = (pos?: { x: number; y: number }) => {
    if (store.currentCatalogId == null) return
    store.creatChapter(store.currentCatalogId, pos ? { pos } : undefined)
  }

  const beginDrag = (chapterId: number, event: PointerEvent) => {
    if (event.button !== 0) return
    const chapter = store.findChapter(chapterId)
    if (!chapter) return

    store.selectChapter(chapterId)
    store.bringChapterToFront(chapterId)
    selectedLink.value = null

    const origin = { ...(chapter.pos ?? { x: 0, y: 0 }) }

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - event.clientX
      const dy = moveEvent.clientY - event.clientY
      if (dx * dx + dy * dy < 25) return
      store.updateChapterPos(chapterId, { x: origin.x + dx, y: origin.y + dy })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const beginResize = (chapterId: number, event: PointerEvent) => {
    if (event.button !== 0) return
    const chapter = store.findChapter(chapterId)
    if (!chapter || chapter.collapsed) return

    event.preventDefault()
    store.selectChapter(chapterId)
    store.bringChapterToFront(chapterId)
    selectedLink.value = null

    const origin = { ...(chapter.size ?? { width: CARD_WIDTH, height: CARD_HEIGHT }) }

    const onMove = (moveEvent: PointerEvent) => {
      store.updateChapterSize(chapterId, {
        width: origin.width + moveEvent.clientX - event.clientX,
        height: origin.height + moveEvent.clientY - event.clientY,
      })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const beginLink = (chapterId: number, event: PointerEvent) => {
    if (event.button !== 0) return
    const point = canvasPoint(event)
    draft.value = { from: chapterId, x: point.x, y: point.y }
    selectedLink.value = null
    store.selectChapter(chapterId)

    const onMove = (moveEvent: PointerEvent) => {
      const next = canvasPoint(moveEvent)
      if (draft.value) draft.value = { from: chapterId, x: next.x, y: next.y }
    }

    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const drop = canvasPoint(upEvent)
      const target = cardAtPoint(drop.x, drop.y, chapterId)
      if (target) store.addCardLink(chapterId, target.id)
      draft.value = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const selectLink = (from: number, to: number) => {
    selectedLink.value = { from, to }
    store.selectChapter(null)
  }

  const onCanvasPointerDown = (event: PointerEvent) => {
    if (event.target !== canvasRef.value && event.target !== viewportRef.value) return
    store.selectChapter(null)
    selectedLink.value = null
  }

  const onCanvasDblClick = (event: MouseEvent) => {
    if (event.target !== canvasRef.value || !canvasRef.value) return
    if (store.currentCatalogId == null) return
    const rect = canvasRef.value.getBoundingClientRect()
    addCard(
      clampCardPos(
        event.clientX - rect.left - CARD_WIDTH / 2,
        event.clientY - rect.top - CARD_HEIGHT / 8,
      ),
    )
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return
    const target = event.target as HTMLElement | null
    if (target && (target.closest('input,textarea') || target.isContentEditable)) return
    if (!selectedLink.value) return
    event.preventDefault()
    store.removeCardLink(selectedLink.value.from, selectedLink.value.to)
    selectedLink.value = null
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))

  return {
    store,
    viewportRef,
    canvasRef,
    catalog,
    cards,
    selectedLink,
    draftPath,
    linkPaths,
    addCard,
    beginDrag,
    beginResize,
    beginLink,
    selectLink,
    onCanvasPointerDown,
    onCanvasDblClick,
  }
}
