import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  CARD_TITLE_HEIGHT,
  cardCenter,
  clampCardPos,
  clampCardSize,
  clampSlotBox,
  defaultCardPos,
  defaultCardSize,
  LABEL_WIDTH,
  nearestSlotAtCenter,
  SLOT_TEXT_MIN,
  gridInSlot,
} from '@/utils/cardLayout'
import { clampSidebarWidth, SIDEBAR_DEFAULT_WIDTH } from '@/utils/sidebarLayout'
import { searchLibrary } from '@/utils/librarySearch'
import {
  breadcrumbFor,
  childCountOf,
  collectSubtreeIds,
  flattenCardTree,
  sameCardParent,
} from '@/utils/cardHierarchy'

export interface Chapter {
  id: number
  name: string
  content: string
  /** 卡片子事件：指向父卡片 id；缺省/undefined 表示顶层 */
  parentId?: number
  pos?: { x: number; y: number }
  size?: { width: number; height: number }
  zIndex?: number
  collapsed?: boolean
}

export interface CardLink {
  from: number
  to: number
}

export interface CardSlot {
  id: number
  x: number
  y: number
  width: number
  height: number
  title: string
  cardIds: number[]
}

export interface BoardLabel {
  id: number
  x: number
  y: number
  width: number
  text: string
}

export interface Catalog {
  id: number
  name: string
  isCatalogExpanded: boolean
  charpterList: Chapter[]
  links?: CardLink[]
  slots?: CardSlot[]
  labels?: BoardLabel[]
}

export interface LibrarySnapshot {
  version: 1
  exportedAt: string
  textCatalogList: Catalog[]
  cardCatalogList: Catalog[]
  nextId: number
}

export const useCatalogStore = defineStore(
  'catalog',
  () => {
    const isMenueExpanded = ref(true)
    const currentWidth = ref(SIDEBAR_DEFAULT_WIDTH)
    const isMenueResizing = ref(false)
    const nextId = ref(1)

    const createId = () => {
      const id = nextId.value
      nextId.value += 1
      return id
    }

    const viewMode = ref<'text' | 'card'>('text')
    const currentChapterId = ref<number | null>(null)
    const currentCatalogId = ref<number | null>(null)
    /** 卡片画布当前所在父层；null 表示组内顶层 */
    const boardParentId = ref<number | null>(null)

    const textCatalogList = ref<Catalog[]>([])
    const cardCatalogList = ref<Catalog[]>([])

    const textCatalogCount = ref(0)
    const cardCatalogCount = ref(0)

    const isText = computed(() => viewMode.value !== 'card')
    const isCard = computed(() => viewMode.value === 'card')

    const currentCatalogList = computed({
      get: () => {
        if (isCard.value) return cardCatalogList.value
        return textCatalogList.value
      },
      set: (val) => {
        if (isCard.value) cardCatalogList.value = val
        else textCatalogList.value = val
      },
    })

    const currentCount = computed(() => {
      if (isCard.value) return cardCatalogCount.value
      return textCatalogCount.value
    })

    const hasCatalogContent = computed(
      () => textCatalogList.value.length > 0 || cardCatalogList.value.length > 0,
    )

    const getCatalogById = computed(() => {
      return (id: number) => currentCatalogList.value.find((c) => c.id === id)
    })

    const allCatalogLists = () => [textCatalogList.value, cardCatalogList.value]

    const findChapter = (chapterId: number): Chapter | undefined => {
      for (const list of allCatalogLists()) {
        for (const catalog of list) {
          const found = catalog.charpterList.find((chapter) => chapter.id === chapterId)
          if (found) return found
        }
      }
      return undefined
    }

    const repairNextId = () => {
      let max = 0
      for (const list of allCatalogLists()) {
        for (const catalog of list) {
          max = Math.max(max, catalog.id)
          for (const chapter of catalog.charpterList) {
            max = Math.max(max, chapter.id)
          }
          for (const slot of catalog.slots ?? []) max = Math.max(max, slot.id)
          for (const label of catalog.labels ?? []) max = Math.max(max, label.id)
        }
      }
      if (nextId.value <= max) nextId.value = max + 1
    }

    const currentChapter = computed(() => {
      if (currentChapterId.value == null) return undefined
      return findChapter(currentChapterId.value)
    })

    const currentCatalog = computed(() => {
      if (currentCatalogId.value == null) return undefined
      return currentCatalogList.value.find((c) => c.id === currentCatalogId.value)
    })

    const boardChapters = computed(() => currentCatalog.value?.charpterList ?? [])

    const boardBreadcrumb = computed(() => {
      if (!isCard.value || !currentCatalog.value) return []
      return breadcrumbFor(currentCatalog.value.charpterList, boardParentId.value)
    })

    const cardTreeForCurrent = computed(() => {
      if (!currentCatalog.value) return []
      return flattenCardTree(currentCatalog.value.charpterList)
    })

    const chapterInCurrentMode = (chapterId: number) =>
      currentCatalogList.value.some((catalog) =>
        catalog.charpterList.some((chapter) => chapter.id === chapterId),
      )

    const nextZIndex = (chapters: Chapter[]) => {
      let max = 0
      for (const chapter of chapters) {
        if (chapter.zIndex != null && chapter.zIndex > max) max = chapter.zIndex
      }
      return max + 1
    }

    type CardPos = { x: number; y: number }
    type CardSize = { width: number; height: number }
    type SlotSnap = { id: number; cardIds: number[] }
    type SlotBoxSnap = { x: number; y: number; width: number; height: number }
    type CardBoardAction =
      | { type: 'addCard'; catalogId: number; chapter: Chapter }
      | { type: 'addLink'; catalogId: number; from: number; to: number }
      | {
          type: 'deleteCards'
          catalogId: number
          chapters: Chapter[]
          links: CardLink[]
          slots: SlotSnap[]
        }
      | { type: 'moveCards'; catalogId: number; items: { id: number; from: CardPos; to: CardPos }[] }
      | {
          type: 'resizeCard'
          catalogId: number
          id: number
          from: CardSize
          to: CardSize
          cards?: { id: number; from: CardPos; to: CardPos }[]
          slot?: { id: number; from: SlotBoxSnap; to: SlotBoxSnap }
        }
      | { type: 'removeLink'; catalogId: number; from: number; to: number }
      | { type: 'addSlot'; catalogId: number; slot: CardSlot }
      | { type: 'deleteSlot'; catalogId: number; slot: CardSlot }
      | {
          type: 'moveSlot'
          catalogId: number
          id: number
          from: SlotBoxSnap
          to: SlotBoxSnap
          cards: { id: number; from: CardPos; to: CardPos }[]
        }
      | {
          type: 'resizeSlot'
          catalogId: number
          id: number
          from: CardSize
          to: CardSize
          cards?: { id: number; from: CardPos; to: CardPos }[]
        }
      | { type: 'renameSlot'; catalogId: number; id: number; from: string; to: string }
      | {
          type: 'placeCards'
          catalogId: number
          cards: { id: number; from: CardPos; to: CardPos }[]
          slots: {
            id: number
            fromIds: number[]
            toIds: number[]
            fromBox: SlotBoxSnap
            toBox: SlotBoxSnap
          }[]
        }
      | { type: 'addLabel'; catalogId: number; label: BoardLabel }
      | { type: 'deleteLabel'; catalogId: number; label: BoardLabel }
      | { type: 'moveLabel'; catalogId: number; id: number; from: CardPos; to: CardPos }
      | { type: 'editLabel'; catalogId: number; id: number; from: string; to: string }

    const undoStack = ref<CardBoardAction[]>([])
    const redoStack = ref<CardBoardAction[]>([])
    const lastBoardAt = ref(0)
    const lastEditAt = ref(0)
    let applyingHistory = false

    const cloneChapter = (chapter: Chapter): Chapter => JSON.parse(JSON.stringify(chapter))

    const findCatalogAnywhere = (catalogId: number) => {
      for (const list of allCatalogLists()) {
        const found = list.find((catalog) => catalog.id === catalogId)
        if (found) return found
      }
      return undefined
    }

    const recordBoardAction = (action: CardBoardAction) => {
      if (applyingHistory) return
      undoStack.value.push(action)
      if (undoStack.value.length > 50) undoStack.value.shift()
      redoStack.value = []
      lastBoardAt.value = Date.now()
    }

    const insertChapterSnapshot = (catalogId: number, chapter: Chapter) => {
      const target = findCatalogAnywhere(catalogId)
      if (!target) return
      if (target.charpterList.some((item) => item.id === chapter.id)) return
      target.charpterList.push(cloneChapter(chapter))
      currentCatalogId.value = catalogId
      currentChapterId.value = chapter.id
    }

    const addLinkToCatalog = (catalogId: number, from: number, to: number) => {
      if (from === to) return false
      const catalog = findCatalogAnywhere(catalogId)
      if (!catalog) return false
      const fromChapter = catalog.charpterList.find((chapter) => chapter.id === from)
      const toChapter = catalog.charpterList.find((chapter) => chapter.id === to)
      if (!fromChapter || !toChapter) return false
      if (!sameCardParent(fromChapter.parentId, toChapter.parentId)) return false
      if (!catalog.links) catalog.links = []
      if (catalog.links.some((link) => link.from === from && link.to === to)) return false
      catalog.links.push({ from, to })
      return true
    }

    const slotOf = (catalogId: number, slotId: number) =>
      findCatalogAnywhere(catalogId)?.slots?.find((slot) => slot.id === slotId)

    const labelOf = (catalogId: number, labelId: number) =>
      findCatalogAnywhere(catalogId)?.labels?.find((label) => label.id === labelId)

    const insertSlot = (catalogId: number, slot: CardSlot) => {
      const catalog = findCatalogAnywhere(catalogId)
      if (!catalog) return
      if (!catalog.slots) catalog.slots = []
      if (catalog.slots.some((item) => item.id === slot.id)) return
      catalog.slots.push(JSON.parse(JSON.stringify(slot)))
    }

    const dropSlot = (catalogId: number, slotId: number) => {
      const catalog = findCatalogAnywhere(catalogId)
      if (!catalog?.slots) return
      catalog.slots = catalog.slots.filter((slot) => slot.id !== slotId)
    }

    const applySlotBox = (catalogId: number, slotId: number, box: { x: number; y: number; width: number; height: number }) => {
      const slot = slotOf(catalogId, slotId)
      if (!slot) return
      const next = clampSlotBox(box)
      slot.x = next.x
      slot.y = next.y
      slot.width = next.width
      slot.height = next.height
    }

    const applySlotSize = (catalogId: number, slotId: number, size: { width: number; height: number }) => {
      const slot = slotOf(catalogId, slotId)
      if (!slot) return
      const next = clampSlotBox({ x: slot.x, y: slot.y, width: size.width, height: size.height })
      slot.width = next.width
      slot.height = next.height
    }

    const writeSlotTitle = (catalogId: number, slotId: number, title: string) => {
      const slot = slotOf(catalogId, slotId)
      if (slot) slot.title = title
    }

    const restoreSlotMembers = (catalogId: number, snaps: { id: number; cardIds: number[] }[]) => {
      for (const snap of snaps) {
        const slot = slotOf(catalogId, snap.id)
        if (slot) slot.cardIds = [...snap.cardIds]
      }
    }

    const insertLabel = (catalogId: number, label: BoardLabel) => {
      const catalog = findCatalogAnywhere(catalogId)
      if (!catalog) return
      if (!catalog.labels) catalog.labels = []
      if (catalog.labels.some((item) => item.id === label.id)) return
      catalog.labels.push({ ...label })
    }

    const dropLabel = (catalogId: number, labelId: number) => {
      const catalog = findCatalogAnywhere(catalogId)
      if (!catalog?.labels) return
      catalog.labels = catalog.labels.filter((label) => label.id !== labelId)
    }

    const writeLabelPos = (catalogId: number, labelId: number, pos: { x: number; y: number }) => {
      const label = labelOf(catalogId, labelId)
      if (!label) return
      const next = clampCardPos(pos.x, pos.y, label.width, 32)
      label.x = next.x
      label.y = next.y
    }

    const writeLabelText = (catalogId: number, labelId: number, text: string) => {
      const label = labelOf(catalogId, labelId)
      if (label) label.text = text
    }

    const chapterHeight = (chapter: Chapter) =>
      chapter.collapsed ? CARD_TITLE_HEIGHT : (chapter.size?.height ?? defaultCardSize().height)

    const reflowSlot = (catalog: Catalog, slot: CardSlot) => {
      const members = slot.cardIds.flatMap((id) => {
        const chapter = catalog.charpterList.find((item) => item.id === id)
        if (!chapter) return []
        const pos = chapter.pos ?? { x: 0, y: 0 }
        return [
          {
            id,
            width: chapter.size?.width ?? defaultCardSize().width,
            height: chapterHeight(chapter),
            x: pos.x,
            y: pos.y,
          },
        ]
      })
      const laid = gridInSlot(slot, members, SLOT_TEXT_MIN)
      const moved: { id: number; from: { x: number; y: number }; to: { x: number; y: number } }[] = []
      for (const item of laid) {
        const chapter = catalog.charpterList.find((entry) => entry.id === item.id)
        if (!chapter) continue
        const from = { ...(chapter.pos ?? { x: 0, y: 0 }) }
        updateChapterPos(item.id, { x: item.x, y: item.y })
        const to = { ...(chapter.pos ?? item) }
        if (from.x !== to.x || from.y !== to.y) moved.push({ id: item.id, from, to })
      }
      return moved
    }

    const dropLinkFromCatalog = (catalogId: number, from: number, to: number) => {
      const catalog = findCatalogAnywhere(catalogId)
      if (!catalog?.links) return
      catalog.links = catalog.links.filter((link) => !(link.from === from && link.to === to))
    }

    const canUndoBoard = computed(() => undoStack.value.length > 0)
    const canRedoBoard = computed(() => redoStack.value.length > 0)

    const markEditorEdit = () => {
      lastEditAt.value = Date.now()
    }

    const shouldUndoBoard = (editorCanUndo: boolean) => {
      if (!canUndoBoard.value) return false
      if (!editorCanUndo) return true
      return lastBoardAt.value >= lastEditAt.value
    }

    const shouldRedoBoard = (editorCanRedo: boolean) => {
      if (!canRedoBoard.value) return false
      if (!editorCanRedo) return true
      return lastBoardAt.value >= lastEditAt.value
    }

    const removeChaptersNow = (catalogId: number, chapterIds: number[]) => {
      const target = findCatalogAnywhere(catalogId)
      if (!target) return
      const idSet = new Set(chapterIds)
      target.charpterList = target.charpterList.filter((chapter) => !idSet.has(chapter.id))
      if (target.links) {
        target.links = target.links.filter((link) => !idSet.has(link.from) && !idSet.has(link.to))
      }
      for (const slot of target.slots ?? []) {
        slot.cardIds = slot.cardIds.filter((id) => !idSet.has(id))
      }
      if (currentChapterId.value != null && idSet.has(currentChapterId.value)) {
        currentChapterId.value = null
      }
      if (boardParentId.value != null && idSet.has(boardParentId.value)) {
        boardParentId.value = null
      }
    }

    const undoBoard = () => {
      const action = undoStack.value.pop()
      if (!action) return
      applyingHistory = true
      if (action.type === 'addCard') {
        const current = findChapter(action.chapter.id)
        if (current) action.chapter = cloneChapter(current)
        removeChaptersNow(action.catalogId, [action.chapter.id])
      } else if (action.type === 'addLink') {
        dropLinkFromCatalog(action.catalogId, action.from, action.to)
      } else if (action.type === 'deleteCards') {
        for (const chapter of action.chapters) insertChapterSnapshot(action.catalogId, chapter)
        for (const link of action.links) addLinkToCatalog(action.catalogId, link.from, link.to)
        restoreSlotMembers(action.catalogId, action.slots)
      } else if (action.type === 'moveCards') {
        for (const item of action.items) updateChapterPos(item.id, item.from)
      } else if (action.type === 'resizeCard') {
        updateChapterSize(action.id, action.from)
        for (const item of action.cards ?? []) updateChapterPos(item.id, item.from)
        if (action.slot) applySlotBox(action.catalogId, action.slot.id, action.slot.from)
      } else if (action.type === 'removeLink') {
        addLinkToCatalog(action.catalogId, action.from, action.to)
      } else if (action.type === 'addSlot') {
        dropSlot(action.catalogId, action.slot.id)
      } else if (action.type === 'deleteSlot') {
        insertSlot(action.catalogId, action.slot)
      } else if (action.type === 'moveSlot') {
        applySlotBox(action.catalogId, action.id, action.from)
        for (const item of action.cards) updateChapterPos(item.id, item.from)
      } else if (action.type === 'resizeSlot') {
        applySlotSize(action.catalogId, action.id, action.from)
        for (const item of action.cards ?? []) updateChapterPos(item.id, item.from)
      } else if (action.type === 'renameSlot') {
        writeSlotTitle(action.catalogId, action.id, action.from)
      } else if (action.type === 'placeCards') {
        for (const item of action.cards) updateChapterPos(item.id, item.from)
        restoreSlotMembers(
          action.catalogId,
          action.slots.map((slot) => ({ id: slot.id, cardIds: slot.fromIds })),
        )
        for (const slot of action.slots) applySlotBox(action.catalogId, slot.id, slot.fromBox)
      } else if (action.type === 'addLabel') {
        dropLabel(action.catalogId, action.label.id)
      } else if (action.type === 'deleteLabel') {
        insertLabel(action.catalogId, action.label)
      } else if (action.type === 'moveLabel') {
        writeLabelPos(action.catalogId, action.id, action.from)
      } else if (action.type === 'editLabel') {
        writeLabelText(action.catalogId, action.id, action.from)
      }
      applyingHistory = false
      redoStack.value.push(action)
      lastBoardAt.value = Date.now()
    }

    const redoBoard = () => {
      const action = redoStack.value.pop()
      if (!action) return
      applyingHistory = true
      if (action.type === 'addCard') {
        insertChapterSnapshot(action.catalogId, action.chapter)
      } else if (action.type === 'addLink') {
        addLinkToCatalog(action.catalogId, action.from, action.to)
      } else if (action.type === 'deleteCards') {
        removeChaptersNow(
          action.catalogId,
          action.chapters.map((chapter) => chapter.id),
        )
      } else if (action.type === 'moveCards') {
        for (const item of action.items) updateChapterPos(item.id, item.to)
      } else if (action.type === 'resizeCard') {
        updateChapterSize(action.id, action.to)
        for (const item of action.cards ?? []) updateChapterPos(item.id, item.to)
        if (action.slot) applySlotBox(action.catalogId, action.slot.id, action.slot.to)
      } else if (action.type === 'removeLink') {
        dropLinkFromCatalog(action.catalogId, action.from, action.to)
      } else if (action.type === 'addSlot') {
        insertSlot(action.catalogId, action.slot)
      } else if (action.type === 'deleteSlot') {
        dropSlot(action.catalogId, action.slot.id)
      } else if (action.type === 'moveSlot') {
        applySlotBox(action.catalogId, action.id, action.to)
        for (const item of action.cards) updateChapterPos(item.id, item.to)
      } else if (action.type === 'resizeSlot') {
        applySlotSize(action.catalogId, action.id, action.to)
        for (const item of action.cards ?? []) updateChapterPos(item.id, item.to)
      } else if (action.type === 'renameSlot') {
        writeSlotTitle(action.catalogId, action.id, action.to)
      } else if (action.type === 'placeCards') {
        for (const item of action.cards) updateChapterPos(item.id, item.to)
        restoreSlotMembers(
          action.catalogId,
          action.slots.map((slot) => ({ id: slot.id, cardIds: slot.toIds })),
        )
        for (const slot of action.slots) applySlotBox(action.catalogId, slot.id, slot.toBox)
      } else if (action.type === 'addLabel') {
        insertLabel(action.catalogId, action.label)
      } else if (action.type === 'deleteLabel') {
        dropLabel(action.catalogId, action.label.id)
      } else if (action.type === 'moveLabel') {
        writeLabelPos(action.catalogId, action.id, action.to)
      } else if (action.type === 'editLabel') {
        writeLabelText(action.catalogId, action.id, action.to)
      }
      applyingHistory = false
      undoStack.value.push(action)
      lastBoardAt.value = Date.now()
    }

    const clearSelectionIfMissing = () => {
      if (currentChapterId.value != null && !chapterInCurrentMode(currentChapterId.value)) {
        currentChapterId.value = null
      }
      if (
        currentCatalogId.value != null &&
        !currentCatalogList.value.some((c) => c.id === currentCatalogId.value)
      ) {
        currentCatalogId.value = null
        boardParentId.value = null
      }
      if (boardParentId.value != null && !findChapter(boardParentId.value)) {
        boardParentId.value = null
      }
    }

    const setViewMode = (mode: 'text' | 'card') => {
      viewMode.value = mode
      if (mode !== 'card') boardParentId.value = null
      clearSelectionIfMissing()
    }

    const selectChapter = (id: number | null) => {
      currentChapterId.value = id
      if (id == null) return
      for (const catalog of currentCatalogList.value) {
        const chapter = catalog.charpterList.find((item) => item.id === id)
        if (!chapter) continue
        currentCatalogId.value = catalog.id
        return
      }
    }

    const revealChapter = (mode: 'text' | 'card', catalogId: number, chapterId: number) => {
      setViewMode(mode)
      if (!isMenueExpanded.value) {
        isMenueExpanded.value = true
        currentWidth.value = SIDEBAR_DEFAULT_WIDTH
      }
      const target = currentCatalogList.value.find((catalog) => catalog.id === catalogId)
      if (target) target.isCatalogExpanded = true
      selectChapter(chapterId)
      if (mode === 'card') bringChapterToFront(chapterId)
    }

    const searchHits = (query: string) =>
      searchLibrary(textCatalogList.value, cardCatalogList.value, query)

    const selectCatalog = (id: number) => {
      if (currentCatalogId.value !== id) {
        boardParentId.value = null
      }
      currentCatalogId.value = id
      if (!isCard.value) return
      const catalog = currentCatalogList.value.find((item) => item.id === id)
      const stays = catalog?.charpterList.some((chapter) => chapter.id === currentChapterId.value)
      if (!stays) currentChapterId.value = null
    }

    const setBoardParent = (parentId: number | null) => {
      if (!isCard.value) return
      if (parentId != null && !findChapter(parentId)) return
      boardParentId.value = parentId
      currentChapterId.value = null
    }

    const enterCardChildren = (chapterId: number) => {
      if (!isCard.value) return
      if (!findChapter(chapterId)) return
      currentCatalogId.value =
        currentCatalogList.value.find((catalog) =>
          catalog.charpterList.some((chapter) => chapter.id === chapterId),
        )?.id ?? currentCatalogId.value
      boardParentId.value = chapterId
      currentChapterId.value = null
    }

    const childCount = (chapterId: number) => {
      for (const list of allCatalogLists()) {
        for (const catalog of list) {
          if (!catalog.charpterList.some((chapter) => chapter.id === chapterId)) continue
          return childCountOf(catalog.charpterList, chapterId)
        }
      }
      return 0
    }

    const updateChapterContent = (id: number, html: string) => {
      const chapter = findChapter(id)
      if (chapter) chapter.content = html
    }

    const createCatalog = () => {
      const newId = createId()

      const newCatalog: Catalog = {
        id: newId,
        name: isCard.value ? '未命名组' : '未命名卷',
        isCatalogExpanded: true,
        charpterList: [],
      }

      if (isText.value) textCatalogList.value.push(newCatalog)
      else cardCatalogList.value.push(newCatalog)
      currentCatalogId.value = newId
      if (isCard.value) currentChapterId.value = null
    }

    const creatChapter = (
      catalogId: number,
      options?: { pos?: { x: number; y: number }; parentId?: number | null },
    ) => {
      const target = currentCatalogList.value.find((c) => c.id === catalogId)
      if (!target) return
      const newId = createId()
      const siblings = target.charpterList
      const newChapter: Chapter = {
        id: newId,
        name: isCard.value ? '未命名卡片' : '未命名章节',
        content: '',
      }
      if (isCard.value) {
        newChapter.pos = options?.pos ?? defaultCardPos(siblings.length)
        newChapter.size = defaultCardSize()
        newChapter.zIndex = nextZIndex(target.charpterList)
      }
      target.charpterList.push(newChapter)
      currentChapterId.value = newId
      currentCatalogId.value = catalogId
      if (isCard.value) {
        recordBoardAction({ type: 'addCard', catalogId, chapter: cloneChapter(newChapter) })
      }
    }

    const ensureCardLayout = (catalogId: number) => {
      const target = currentCatalogList.value.find((c) => c.id === catalogId)
      if (!target) return
      let z = 0
      for (const chapter of target.charpterList) {
        if (chapter.zIndex != null) z = Math.max(z, chapter.zIndex)
      }
      target.charpterList.forEach((chapter, index) => {
        if (!chapter.pos) chapter.pos = defaultCardPos(index)
        if (!chapter.size) chapter.size = defaultCardSize()
        if (chapter.zIndex == null) {
          z += 1
          chapter.zIndex = z
        }
      })
    }

    const updateChapterPos = (id: number, pos: { x: number; y: number }) => {
      const chapter = findChapter(id)
      if (!chapter) return
      const size = chapter.size ?? defaultCardSize()
      const height = chapter.collapsed ? CARD_TITLE_HEIGHT : size.height
      chapter.pos = clampCardPos(pos.x, pos.y, size.width, height)
    }

    const updateChapterSize = (id: number, size: { width: number; height: number }) => {
      const chapter = findChapter(id)
      if (!chapter) return
      chapter.size = clampCardSize(size.width, size.height, chapter.pos)
    }

    const recordMoveCards = (items: { id: number; from: CardPos; to: CardPos }[]) => {
      const catalogId = currentCatalogId.value
      if (catalogId == null || items.length === 0) return
      recordBoardAction({ type: 'moveCards', catalogId, items })
    }

    const recordResizeCard = (id: number, from: CardSize, to: CardSize) => {
      const catalogId = currentCatalogId.value
      const catalog = catalogId == null ? undefined : findCatalogAnywhere(catalogId)
      if (catalogId == null || !catalog) return
      const slot = catalog.slots?.find((item) => item.cardIds.includes(id))
      const slotFrom = slot
        ? { x: slot.x, y: slot.y, width: slot.width, height: slot.height }
        : null
      const before = slot
        ? slot.cardIds.flatMap((cardId) => {
            const chapter = catalog.charpterList.find((item) => item.id === cardId)
            if (!chapter?.pos) return []
            return [{ id: cardId, from: { ...chapter.pos } }]
          })
        : []
      const shifted = slot ? reflowSlot(catalog, slot) : []
      const cards = before.flatMap((item) => {
        const next = shifted.find((entry) => entry.id === item.id)
        if (!next || (next.to.x === item.from.x && next.to.y === item.from.y)) return []
        return [{ id: item.id, from: item.from, to: next.to }]
      })
      const slotChange =
        slot && slotFrom && (slot.x !== slotFrom.x || slot.y !== slotFrom.y || slot.width !== slotFrom.width || slot.height !== slotFrom.height)
          ? {
              id: slot.id,
              from: slotFrom,
              to: { x: slot.x, y: slot.y, width: slot.width, height: slot.height },
            }
          : undefined
      if (from.width === to.width && from.height === to.height && cards.length === 0 && !slotChange) return
      recordBoardAction({ type: 'resizeCard', catalogId, id, from, to, cards, slot: slotChange })
    }

    const addSlot = (box: { x: number; y: number; width: number; height: number }) => {
      const catalogId = currentCatalogId.value
      const catalog = catalogId == null ? undefined : findCatalogAnywhere(catalogId)
      if (catalogId == null || !catalog) return null
      const frame = clampSlotBox(box)
      const slot: CardSlot = {
        id: createId(),
        ...frame,
        title: '未命名卡槽',
        cardIds: [],
      }
      if (!catalog.slots) catalog.slots = []
      catalog.slots.push(slot)
      recordBoardAction({ type: 'addSlot', catalogId, slot: JSON.parse(JSON.stringify(slot)) })
      return slot.id
    }

    const renameSlot = (slotId: number, title: string) => {
      const catalogId = currentCatalogId.value
      const slot = catalogId == null ? undefined : slotOf(catalogId, slotId)
      if (catalogId == null || !slot || slot.title === title) return
      const from = slot.title
      slot.title = title
      recordBoardAction({ type: 'renameSlot', catalogId, id: slotId, from, to: title })
    }

    const deleteSlot = (slotId: number) => {
      const catalogId = currentCatalogId.value
      const catalog = catalogId == null ? undefined : findCatalogAnywhere(catalogId)
      const slot = catalog?.slots?.find((item) => item.id === slotId)
      if (catalogId == null || !catalog || !slot) return
      const snapshot = JSON.parse(JSON.stringify(slot)) as CardSlot
      catalog.slots = (catalog.slots ?? []).filter((item) => item.id !== slotId)
      recordBoardAction({ type: 'deleteSlot', catalogId, slot: snapshot })
    }

    const moveSlot = (
      slotId: number,
      from: { x: number; y: number; width: number; height: number },
      cards: { id: number; from: { x: number; y: number } }[],
    ) => {
      const catalogId = currentCatalogId.value
      const slot = catalogId == null ? undefined : slotOf(catalogId, slotId)
      if (catalogId == null || !slot) return
      const to = { x: slot.x, y: slot.y, width: slot.width, height: slot.height }
      if (to.x === from.x && to.y === from.y && to.width === from.width && to.height === from.height) return
      const items = cards.flatMap((item) => {
        const chapter = findChapter(item.id)
        if (!chapter?.pos) return []
        return [{ id: item.id, from: item.from, to: { ...chapter.pos } }]
      })
      recordBoardAction({ type: 'moveSlot', catalogId, id: slotId, from, to, cards: items })
    }

    const resizeSlot = (
      slotId: number,
      from: { width: number; height: number },
      cardsFrom: { id: number; from: { x: number; y: number } }[] = [],
    ) => {
      const catalogId = currentCatalogId.value
      const slot = catalogId == null ? undefined : slotOf(catalogId, slotId)
      if (catalogId == null || !slot) return
      const cards = cardsFrom.flatMap((item) => {
        const chapter = findChapter(item.id)
        if (!chapter?.pos) return []
        if (chapter.pos.x === item.from.x && chapter.pos.y === item.from.y) return []
        return [{ id: item.id, from: item.from, to: { ...chapter.pos } }]
      })
      if (slot.width === from.width && slot.height === from.height && cards.length === 0) return
      recordBoardAction({
        type: 'resizeSlot',
        catalogId,
        id: slotId,
        from,
        to: { width: slot.width, height: slot.height },
        cards,
      })
    }

    const shiftSlot = (
      slotId: number,
      x: number,
      y: number,
      origin: { x: number; y: number },
      cards: { id: number; x: number; y: number }[],
    ) => {
      const catalogId = currentCatalogId.value
      const slot = catalogId == null ? undefined : slotOf(catalogId, slotId)
      if (!slot) return
      const next = clampSlotBox({ x, y, width: slot.width, height: slot.height })
      const dx = next.x - origin.x
      const dy = next.y - origin.y
      slot.x = next.x
      slot.y = next.y
      for (const card of cards) {
        updateChapterPos(card.id, { x: card.x + dx, y: card.y + dy })
      }
    }

    const resizeSlotLive = (slotId: number, width: number, height: number) => {
      const catalogId = currentCatalogId.value
      const catalog = catalogId == null ? undefined : findCatalogAnywhere(catalogId)
      const slot = catalog?.slots?.find((item) => item.id === slotId)
      if (catalogId == null || !catalog || !slot) return
      applySlotSize(catalogId, slotId, { width, height })
      reflowSlot(catalog, slot)
    }

    const placeCards = (dragged: { id: number; from: { x: number; y: number } }[]) => {
      const catalogId = currentCatalogId.value
      const catalog = catalogId == null ? undefined : findCatalogAnywhere(catalogId)
      if (catalogId == null || !catalog || dragged.length === 0) return
      const slots = catalog.slots ?? []
      const draggedIds = new Set(dragged.map((item) => item.id))
      const fromSlots = slots.map((slot) => ({
        id: slot.id,
        fromIds: [...slot.cardIds],
        fromBox: { x: slot.x, y: slot.y, width: slot.width, height: slot.height },
      }))
      const targetOf = new Map<number, number | null>()
      for (const item of dragged) {
        const chapter = catalog.charpterList.find((entry) => entry.id === item.id)
        if (!chapter) continue
        targetOf.set(item.id, nearestSlotAtCenter(slots, cardCenter(chapter))?.id ?? null)
      }
      const touched = slots.filter((slot) => {
        const had = slot.cardIds.some((id) => draggedIds.has(id))
        const has = [...targetOf.values()].includes(slot.id)
        return had || has
      })
      const siblingFrom = new Map<number, { x: number; y: number }>()
      for (const slot of touched) {
        for (const id of slot.cardIds) {
          if (draggedIds.has(id)) continue
          const chapter = catalog.charpterList.find((entry) => entry.id === id)
          if (chapter?.pos) siblingFrom.set(id, { ...chapter.pos })
        }
        const kept = slot.cardIds.filter((id) => !draggedIds.has(id))
        const incoming = dragged.flatMap((item) => (targetOf.get(item.id) === slot.id ? [item.id] : []))
        const members = [...kept, ...incoming].flatMap((id) => {
          const chapter = catalog.charpterList.find((entry) => entry.id === id)
          if (!chapter) return []
          const pos = chapter.pos ?? { x: 0, y: 0 }
          return [{ id, x: pos.x, y: pos.y }]
        })
        members.sort((a, b) => a.y - b.y || a.x - b.x || a.id - b.id)
        slot.cardIds = members.map((item) => item.id)
        reflowSlot(catalog, slot)
      }
      const cards = [
        ...dragged.flatMap((item) => {
          const chapter = catalog.charpterList.find((entry) => entry.id === item.id)
          if (!chapter?.pos) return []
          if (chapter.pos.x === item.from.x && chapter.pos.y === item.from.y) return []
          return [{ id: item.id, from: item.from, to: { ...chapter.pos } }]
        }),
        ...[...siblingFrom.entries()].flatMap(([id, from]) => {
          const chapter = catalog.charpterList.find((entry) => entry.id === id)
          if (!chapter?.pos) return []
          if (chapter.pos.x === from.x && chapter.pos.y === from.y) return []
          return [{ id, from, to: { ...chapter.pos } }]
        }),
      ]
      const slotChanges = fromSlots.flatMap((slot) => {
        const current = slots.find((item) => item.id === slot.id)
        if (!current) return []
        const sameIds = current.cardIds.join(',') === slot.fromIds.join(',')
        const sameBox =
          current.x === slot.fromBox.x &&
          current.y === slot.fromBox.y &&
          current.width === slot.fromBox.width &&
          current.height === slot.fromBox.height
        if (sameIds && sameBox) return []
        return [
          {
            id: slot.id,
            fromIds: slot.fromIds,
            toIds: [...current.cardIds],
            fromBox: slot.fromBox,
            toBox: { x: current.x, y: current.y, width: current.width, height: current.height },
          },
        ]
      })
      if (cards.length === 0 && slotChanges.length === 0) return
      recordBoardAction({ type: 'placeCards', catalogId, cards, slots: slotChanges })
    }

    const addLabel = (pos: { x: number; y: number }) => {
      const catalogId = currentCatalogId.value
      const catalog = catalogId == null ? undefined : findCatalogAnywhere(catalogId)
      if (catalogId == null || !catalog) return null
      const parked = clampCardPos(pos.x, pos.y, LABEL_WIDTH, 32)
      const label: BoardLabel = {
        id: createId(),
        x: parked.x,
        y: parked.y,
        width: LABEL_WIDTH,
        text: '标注',
      }
      if (!catalog.labels) catalog.labels = []
      catalog.labels.push(label)
      recordBoardAction({ type: 'addLabel', catalogId, label: { ...label } })
      return label.id
    }

    const editLabel = (labelId: number, text: string) => {
      const catalogId = currentCatalogId.value
      const label = catalogId == null ? undefined : labelOf(catalogId, labelId)
      if (catalogId == null || !label || label.text === text) return
      const from = label.text
      label.text = text
      recordBoardAction({ type: 'editLabel', catalogId, id: labelId, from, to: text })
    }

    const deleteLabel = (labelId: number) => {
      const catalogId = currentCatalogId.value
      const catalog = catalogId == null ? undefined : findCatalogAnywhere(catalogId)
      const label = catalog?.labels?.find((item) => item.id === labelId)
      if (catalogId == null || !catalog || !label) return
      const snapshot = { ...label }
      catalog.labels = (catalog.labels ?? []).filter((item) => item.id !== labelId)
      recordBoardAction({ type: 'deleteLabel', catalogId, label: snapshot })
    }

    const shiftLabel = (labelId: number, x: number, y: number) => {
      const catalogId = currentCatalogId.value
      if (catalogId == null) return
      writeLabelPos(catalogId, labelId, { x, y })
    }

    const recordLabelMove = (labelId: number, from: { x: number; y: number }) => {
      const catalogId = currentCatalogId.value
      const label = catalogId == null ? undefined : labelOf(catalogId, labelId)
      if (catalogId == null || !label) return
      if (label.x === from.x && label.y === from.y) return
      recordBoardAction({
        type: 'moveLabel',
        catalogId,
        id: labelId,
        from,
        to: { x: label.x, y: label.y },
      })
    }

    const toggleChapterCollapsed = (id: number) => {
      const chapter = findChapter(id)
      if (!chapter) return
      chapter.collapsed = !chapter.collapsed
    }

    const addCardLink = (from: number, to: number) => {
      const catalogId = currentCatalogId.value
      if (catalogId == null) return
      if (!addLinkToCatalog(catalogId, from, to)) return
      recordBoardAction({ type: 'addLink', catalogId, from, to })
    }

    const removeCardLink = (from: number, to: number) => {
      const catalogId = currentCatalogId.value
      if (catalogId == null) return
      dropLinkFromCatalog(catalogId, from, to)
      recordBoardAction({ type: 'removeLink', catalogId, from, to })
    }

    const bringChapterToFront = (id: number) => {
      const chapter = findChapter(id)
      if (!chapter) return
      const catalog = currentCatalogList.value.find((item) =>
        item.charpterList.some((entry) => entry.id === id),
      )
      if (!catalog) return
      chapter.zIndex = nextZIndex(catalog.charpterList)
    }

    const updateChapters = (catalogId: number, newList: Chapter[]) => {
      const target = currentCatalogList.value.find((c) => c.id === catalogId)
      if (target) target.charpterList = newList
    }

    const renameCatalog = (catalogId: number, name: string) => {
      const target = currentCatalogList.value.find((c) => c.id === catalogId)
      if (target) target.name = name
    }

    const renameChapter = (chapterId: number, name: string) => {
      const target = findChapter(chapterId)
      if (target) target.name = name
    }

    const deleteCatalog = (catalogId: number) => {
      const target = currentCatalogList.value.find((c) => c.id === catalogId)
      if (
        target &&
        currentChapterId.value != null &&
        target.charpterList.some((ch) => ch.id === currentChapterId.value)
      ) {
        currentChapterId.value = null
      }
      currentCatalogList.value = currentCatalogList.value.filter((c) => c.id !== catalogId)
      if (currentCatalogId.value === catalogId) {
        currentCatalogId.value = null
        boardParentId.value = null
      }
    }

    const deleteChapters = (catalogId: number, chapterIds: number[]) => {
      const target = findCatalogAnywhere(catalogId)
      if (!target) return
      const idSet = collectSubtreeIds(target.charpterList, chapterIds)
      if (idSet.size === 0) return
      const chapters = target.charpterList.filter((chapter) => idSet.has(chapter.id)).map(cloneChapter)
      if (chapters.length === 0) return
      const links = (target.links ?? [])
        .filter((link) => idSet.has(link.from) || idSet.has(link.to))
        .map((link) => ({ ...link }))
      const slots = (target.slots ?? [])
        .filter((slot) => slot.cardIds.some((id) => idSet.has(id)))
        .map((slot) => ({ id: slot.id, cardIds: [...slot.cardIds] }))
      if (isCard.value) {
        recordBoardAction({ type: 'deleteCards', catalogId, chapters, links, slots })
      }
      removeChaptersNow(
        catalogId,
        chapters.map((chapter) => chapter.id),
      )
    }

    const deleteChapter = (catalogId: number, chapterId: number) => {
      deleteChapters(catalogId, [chapterId])
    }

    const toggleMenueExpand = () => {
      isMenueExpanded.value = !isMenueExpanded.value
      if (isMenueExpanded.value) {
        currentWidth.value = SIDEBAR_DEFAULT_WIDTH
      }
    }

    const setSidebarWidth = (width: number) => {
      currentWidth.value = clampSidebarWidth(width)
    }

    const toggleCatalogExpand = (catalogId: number) => {
      const target = currentCatalogList.value.find((c) => c.id === catalogId)
      if (!target) return false
      target.isCatalogExpanded = !target.isCatalogExpanded
      return target.isCatalogExpanded
    }

    const getLibrarySnapshot = (): LibrarySnapshot => ({
      version: 1,
      exportedAt: new Date().toISOString(),
      textCatalogList: JSON.parse(JSON.stringify(textCatalogList.value)),
      cardCatalogList: JSON.parse(JSON.stringify(cardCatalogList.value)),
      nextId: nextId.value,
    })

    const replaceLibrary = (snapshot: LibrarySnapshot) => {
      textCatalogList.value = snapshot.textCatalogList
      cardCatalogList.value = snapshot.cardCatalogList
      nextId.value = snapshot.nextId
      undoStack.value = []
      redoStack.value = []
      repairNextId()
      clearSelectionIfMissing()
    }

    const importVolumes = (volumes: { name: string; chapters: { name: string; content: string }[] }[]) => {
      let firstChapterId: number | null = null
      let firstCatalogId: number | null = null
      for (const volume of volumes) {
        const catalogId = createId()
        if (firstCatalogId == null) firstCatalogId = catalogId
        const catalog: Catalog = {
          id: catalogId,
          name: volume.name || '未命名卷',
          isCatalogExpanded: true,
          charpterList: volume.chapters.map((chapter) => {
            const id = createId()
            if (firstChapterId == null) firstChapterId = id
            return { id, name: chapter.name || '未命名章节', content: chapter.content }
          }),
        }
        currentCatalogList.value.push(catalog)
      }
      if (firstCatalogId != null) currentCatalogId.value = firstCatalogId
      if (firstChapterId != null) currentChapterId.value = firstChapterId
    }

    const importChapters = (
      catalogId: number,
      chapters: { name: string; content: string }[],
    ) => {
      const target = currentCatalogList.value.find((catalog) => catalog.id === catalogId)
      if (!target) return
      for (const chapter of chapters) {
        const id = createId()
        target.charpterList.push({
          id,
          name: chapter.name || '未命名章节',
          content: chapter.content,
        })
        currentChapterId.value = id
      }
      currentCatalogId.value = catalogId
    }

    const flattenCardLayers = () => {
      for (const catalog of cardCatalogList.value) {
        for (const chapter of catalog.charpterList) {
          if (chapter.parentId != null) chapter.parentId = undefined
        }
      }
      boardParentId.value = null
    }

    return {
      currentWidth,
      isMenueResizing,
      viewMode,
      currentChapterId,
      currentCatalogId,
      boardParentId,
      isMenueExpanded,
      isText,
      isCard,
      currentCatalogList,
      currentCount,
      hasCatalogContent,
      currentChapter,
      currentCatalog,
      boardChapters,
      boardBreadcrumb,
      cardTreeForCurrent,
      getCatalogById,
      findChapter,
      setViewMode,
      selectChapter,
      revealChapter,
      searchHits,
      selectCatalog,
      setBoardParent,
      enterCardChildren,
      childCount,
      updateChapterContent,
      createCatalog,
      creatChapter,
      ensureCardLayout,
      updateChapterPos,
      updateChapterSize,
      toggleChapterCollapsed,
      addCardLink,
      removeCardLink,
      bringChapterToFront,
      updateChapters,
      renameCatalog,
      renameChapter,
      deleteCatalog,
      deleteChapter,
      deleteChapters,
      recordMoveCards,
      recordResizeCard,
      addSlot,
      renameSlot,
      deleteSlot,
      moveSlot,
      resizeSlot,
      shiftSlot,
      resizeSlotLive,
      placeCards,
      addLabel,
      editLabel,
      deleteLabel,
      shiftLabel,
      recordLabelMove,
      markEditorEdit,
      canUndoBoard,
      canRedoBoard,
      shouldUndoBoard,
      shouldRedoBoard,
      undoBoard,
      redoBoard,
      nextId,
      toggleMenueExpand,
      setSidebarWidth,
      toggleCatalogExpand,
      repairNextId,
      clearSelectionIfMissing,
      getLibrarySnapshot,
      replaceLibrary,
      importVolumes,
      importChapters,
      flattenCardLayers,
    }
  },
  {
    persist: {
      omit: ['isMenueResizing', 'canUndoBoard', 'canRedoBoard', 'hasCatalogContent'],
      afterHydrate: (ctx) => {
        ctx.store.repairNextId()
        ctx.store.flattenCardLayers()
        ctx.store.clearSelectionIfMissing()
        ctx.store.currentWidth = clampSidebarWidth(ctx.store.currentWidth)
      },
    },
  },
)
