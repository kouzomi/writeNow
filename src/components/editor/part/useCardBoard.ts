import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useCatalogStore } from '@/stores/shelf'
import {
  CARD_CANVAS_HEIGHT,
  CARD_CANVAS_WIDTH,
  CARD_HEIGHT,
  CARD_WIDTH,
  CARD_ZOOM_STEP,
  boxAnchorToward,
  boxesOverlap,
  cardBox,
  clampCardPos,
  clampZoom,
  defaultCardSize,
  normalizeRect,
  pointInBox,
  type CardBox,
} from '@/utils/cardLayout'

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(target.closest('input,textarea,select') || target.isContentEditable)
}

export const useCardBoard = () => {
  const store = useCatalogStore()
  const viewportRef = ref<HTMLElement | null>(null)
  const canvasRef = ref<HTMLElement | null>(null)
  const selectedLink = ref<{ from: number; to: number } | null>(null)
  const selectedIds = ref<number[]>([])
  const draft = ref<{ from: number; x: number; y: number } | null>(null)
  const marquee = ref<CardBox | null>(null)
  const scale = ref(1)
  const panning = ref(false)
  const viewByCatalog = new Map<number, { scale: number; left: number; top: number }>()

  const catalog = computed(() => store.currentCatalog)
  const cards = computed(() => catalog.value?.charpterList ?? [])
  const zoomLabel = computed(() => `${Math.round(scale.value * 100)}%`)
  const worldWidth = computed(() => CARD_CANVAS_WIDTH * scale.value)
  const worldHeight = computed(() => CARD_CANVAS_HEIGHT * scale.value)

  const setSelection = (ids: number[], focusId?: number | null) => {
    selectedIds.value = ids
    if (ids.length === 1 && ids[0] != null) {
      store.selectChapter(ids[0])
      store.bringChapterToFront(ids[0])
      return
    }
    if (focusId != null && ids.includes(focusId)) {
      store.selectChapter(focusId)
      return
    }
    store.selectChapter(null)
  }

  watch(
    () => store.currentCatalogId,
    (id, prev) => {
      const viewport = viewportRef.value
      if (prev != null) {
        viewByCatalog.set(prev, {
          scale: scale.value,
          left: viewport?.scrollLeft ?? 0,
          top: viewport?.scrollTop ?? 0,
        })
      }
      const next = id != null ? viewByCatalog.get(id) : undefined
      scale.value = next?.scale ?? 1
      selectedIds.value = []
      selectedLink.value = null
      void nextTick(() => {
        if (!viewportRef.value) return
        viewportRef.value.scrollLeft = next?.left ?? 0
        viewportRef.value.scrollTop = next?.top ?? 0
      })
    },
  )

  watch(
    () => [store.currentChapterId, viewportRef.value] as const,
    async ([id]) => {
      if (id != null) {
        selectedLink.value = null
        if (!selectedIds.value.includes(id)) selectedIds.value = [id]
      }
      if (id == null) return
      await nextTick()
      const chapter = cards.value.find((item) => item.id === id)
      const viewport = viewportRef.value
      if (!chapter || !viewport) return
      const box = cardBox(chapter)
      const pad = 32
      const left = box.x * scale.value
      const top = box.y * scale.value
      const width = box.width * scale.value
      const height = box.height * scale.value
      const viewLeft = viewport.scrollLeft
      const viewTop = viewport.scrollTop
      const viewRight = viewLeft + viewport.clientWidth
      const viewBottom = viewTop + viewport.clientHeight
      const visible =
        left >= viewLeft + pad &&
        top >= viewTop + pad &&
        left + width <= viewRight - pad &&
        top + height <= viewBottom - pad
      if (visible) return
      viewport.scrollTo({
        left: Math.max(0, left - pad),
        top: Math.max(0, top - pad),
      })
    },
  )

  watch(
    () => [store.currentCatalogId, cards.value.length] as const,
    () => {
      if (store.currentCatalogId == null || !store.isCard) return
      store.ensureCardLayout(store.currentCatalogId)
      selectedLink.value = null
      const idSet = new Set(cards.value.map((chapter) => chapter.id))
      selectedIds.value = selectedIds.value.filter((id) => idSet.has(id))
    },
    { immediate: true },
  )

  const canvasPoint = (event: PointerEvent | MouseEvent) => {
    if (!canvasRef.value) return { x: 0, y: 0 }
    const rect = canvasRef.value.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }
    return {
      x: ((event.clientX - rect.left) / rect.width) * CARD_CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CARD_CANVAS_HEIGHT,
    }
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

  const zoomAt = (clientX: number, clientY: number, next: number) => {
    const viewport = viewportRef.value
    const clamped = clampZoom(next)
    if (!viewport) {
      scale.value = clamped
      return
    }
    if (clamped === scale.value) return
    const rect = viewport.getBoundingClientRect()
    const canvasX = (clientX - rect.left + viewport.scrollLeft) / scale.value
    const canvasY = (clientY - rect.top + viewport.scrollTop) / scale.value
    scale.value = clamped
    void nextTick(() => {
      viewport.scrollLeft = canvasX * clamped - (clientX - rect.left)
      viewport.scrollTop = canvasY * clamped - (clientY - rect.top)
    })
  }

  const nudgeZoom = (direction: number) => {
    const viewport = viewportRef.value
    if (!viewport) {
      scale.value = clampZoom(scale.value + direction * CARD_ZOOM_STEP)
      return
    }
    const rect = viewport.getBoundingClientRect()
    zoomAt(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      scale.value + direction * CARD_ZOOM_STEP,
    )
  }

  const resetZoom = () => {
    const viewport = viewportRef.value
    if (!viewport) {
      scale.value = 1
      return
    }
    const rect = viewport.getBoundingClientRect()
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1)
  }

  const beginPan = (event: PointerEvent) => {
    const viewport = viewportRef.value
    if (!viewport) return
    event.preventDefault()
    panning.value = true
    const origin = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop }

    const onMove = (moveEvent: PointerEvent) => {
      viewport.scrollLeft = origin.left - (moveEvent.clientX - origin.x)
      viewport.scrollTop = origin.top - (moveEvent.clientY - origin.y)
    }

    const onUp = () => {
      panning.value = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onCardSelect = (chapterId: number, event: PointerEvent) => {
    selectedLink.value = null
    if (event.shiftKey) {
      const next = new Set(selectedIds.value)
      if (next.has(chapterId)) next.delete(chapterId)
      else next.add(chapterId)
      setSelection([...next], next.has(chapterId) ? chapterId : undefined)
      return
    }
    setSelection([chapterId])
  }

  const beginDrag = (chapterId: number, event: PointerEvent) => {
    if (event.button !== 0) return
    const chapter = store.findChapter(chapterId)
    if (!chapter) return

    if (event.shiftKey) {
      onCardSelect(chapterId, event)
      return
    }

    if (!selectedIds.value.includes(chapterId)) setSelection([chapterId])
    store.selectChapter(chapterId)
    store.bringChapterToFront(chapterId)
    selectedLink.value = null

    const ids = selectedIds.value.length > 0 ? [...selectedIds.value] : [chapterId]
    const origins = ids.map((id) => {
      const item = store.findChapter(id)
      return { id, from: { ...(item?.pos ?? { x: 0, y: 0 }) } }
    })

    let moved = false

    const onMove = (moveEvent: PointerEvent) => {
      const sdx = moveEvent.clientX - event.clientX
      const sdy = moveEvent.clientY - event.clientY
      if (!moved) {
        if (sdx * sdx + sdy * sdy < 25) return
        moved = true
      }
      const dx = sdx / scale.value
      const dy = sdy / scale.value
      for (const origin of origins) {
        store.updateChapterPos(origin.id, { x: origin.from.x + dx, y: origin.from.y + dy })
      }
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (!moved) {
        setSelection([chapterId])
        return
      }
      const items = origins.flatMap((origin) => {
        const item = store.findChapter(origin.id)
        if (!item) return []
        const to = { ...(item.pos ?? origin.from) }
        if (to.x === origin.from.x && to.y === origin.from.y) return []
        return [{ id: origin.id, from: origin.from, to }]
      })
      store.recordMoveCards(items)
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

    const origin = { ...(chapter.size ?? defaultCardSize()) }
    let last = { ...origin }

    const onMove = (moveEvent: PointerEvent) => {
      store.updateChapterSize(chapterId, {
        width: origin.width + (moveEvent.clientX - event.clientX) / scale.value,
        height: origin.height + (moveEvent.clientY - event.clientY) / scale.value,
      })
      const current = store.findChapter(chapterId)
      if (current?.size) last = { ...current.size }
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      store.recordResizeCard(chapterId, origin, last)
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
    selectedIds.value = []
    store.selectChapter(null)
  }

  const beginBoxSelect = (event: PointerEvent) => {
    if (event.button !== 0) return
    const origin = canvasPoint(event)
    marquee.value = { x: origin.x, y: origin.y, width: 0, height: 0 }
    let moved = false

    const onMove = (moveEvent: PointerEvent) => {
      const point = canvasPoint(moveEvent)
      marquee.value = normalizeRect(origin.x, origin.y, point.x, point.y)
      const box = marquee.value
      if (box.width > 3 || box.height > 3) moved = true
    }

    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      const rect = marquee.value
      marquee.value = null
      if (!moved || !rect) {
        if (!upEvent.shiftKey) setSelection([])
        selectedLink.value = null
        return
      }
      const hits = cards.value.filter((chapter) => boxesOverlap(cardBox(chapter), rect)).map((chapter) => chapter.id)
      if (upEvent.shiftKey) {
        setSelection([...new Set([...selectedIds.value, ...hits])])
      } else {
        setSelection(hits)
      }
      selectedLink.value = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onViewportPointerDown = (event: PointerEvent) => {
    if (event.button === 1) {
      event.preventDefault()
      event.stopPropagation()
      beginPan(event)
      return
    }
    if (event.target !== canvasRef.value) {
      if (event.target === viewportRef.value) {
        setSelection([])
        selectedLink.value = null
      }
      return
    }
    beginBoxSelect(event)
  }

  const onCanvasDblClick = (event: MouseEvent) => {
    if (event.target !== canvasRef.value || !canvasRef.value) return
    if (store.currentCatalogId == null) return
    const point = canvasPoint(event)
    addCard(clampCardPos(point.x - CARD_WIDTH / 2, point.y - CARD_HEIGHT / 8))
  }

  const onWheel = (event: WheelEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.08 : 1 / 1.08
    zoomAt(event.clientX, event.clientY, scale.value * factor)
  }

  const onKeydown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === '0' && !isTypingTarget(event.target)) {
      event.preventDefault()
      resetZoom()
      return
    }
    if (event.key === 'Escape') {
      setSelection([])
      selectedLink.value = null
      return
    }
    if (event.key !== 'Delete' && event.key !== 'Backspace') return
    if (isTypingTarget(event.target)) return
    if (selectedLink.value) {
      event.preventDefault()
      store.removeCardLink(selectedLink.value.from, selectedLink.value.to)
      selectedLink.value = null
      return
    }
    if (selectedIds.value.length === 0 || store.currentCatalogId == null) return
    event.preventDefault()
    const count = selectedIds.value.length
    const message = count === 1 ? '确定删除这张卡片？' : `确定删除这 ${count} 张卡片？`
    if (!confirm(message)) return
    store.deleteChapters(store.currentCatalogId, selectedIds.value)
    selectedIds.value = []
  }

  const onAuxClick = (event: MouseEvent) => {
    if (event.button === 1) event.preventDefault()
  }

  const onMiddleMouseDown = (event: MouseEvent) => {
    if (event.button !== 1) return
    event.preventDefault()
  }

  watch(viewportRef, (el, prev) => {
    prev?.removeEventListener('wheel', onWheel)
    prev?.removeEventListener('auxclick', onAuxClick)
    prev?.removeEventListener('mousedown', onMiddleMouseDown, true)
    el?.addEventListener('wheel', onWheel, { passive: false })
    el?.addEventListener('auxclick', onAuxClick)
    el?.addEventListener('mousedown', onMiddleMouseDown, { capture: true })
  })

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    viewportRef.value?.addEventListener('wheel', onWheel, { passive: false })
    viewportRef.value?.addEventListener('auxclick', onAuxClick)
    viewportRef.value?.addEventListener('mousedown', onMiddleMouseDown, { capture: true })
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    viewportRef.value?.removeEventListener('wheel', onWheel)
    viewportRef.value?.removeEventListener('auxclick', onAuxClick)
    viewportRef.value?.removeEventListener('mousedown', onMiddleMouseDown, true)
  })

  return {
    store,
    viewportRef,
    canvasRef,
    catalog,
    cards,
    selectedLink,
    selectedIds,
    draftPath,
    linkPaths,
    marquee,
    scale,
    zoomLabel,
    worldWidth,
    worldHeight,
    panning,
    addCard,
    nudgeZoom,
    resetZoom,
    onCardSelect,
    beginDrag,
    beginResize,
    beginLink,
    selectLink,
    onViewportPointerDown,
    onCanvasDblClick,
  }
}
