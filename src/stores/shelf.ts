import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  CARD_TITLE_HEIGHT,
  clampCardPos,
  clampCardSize,
  defaultCardPos,
  defaultCardSize,
} from '@/utils/cardLayout'
import { clampSidebarWidth, SIDEBAR_DEFAULT_WIDTH } from '@/utils/sidebarLayout'
import { searchLibrary } from '@/utils/librarySearch'

export interface Chapter {
  id: number
  name: string
  content: string
  pos?: { x: number; y: number }
  size?: { width: number; height: number }
  zIndex?: number
  collapsed?: boolean
}

export interface CardLink {
  from: number
  to: number
}

export interface Catalog {
  id: number
  name: string
  isCatalogExpanded: boolean
  charpterList: Chapter[]
  links?: CardLink[]
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

    type CardBoardAction =
      | { type: 'addCard'; catalogId: number; chapter: Chapter }
      | { type: 'addLink'; catalogId: number; from: number; to: number }

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
      if (!catalog.links) catalog.links = []
      if (catalog.links.some((link) => link.from === from && link.to === to)) return false
      catalog.links.push({ from, to })
      return true
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

    const undoBoard = () => {
      const action = undoStack.value.pop()
      if (!action) return
      applyingHistory = true
      if (action.type === 'addCard') {
        const current = findChapter(action.chapter.id)
        if (current) action.chapter = cloneChapter(current)
        deleteChapter(action.catalogId, action.chapter.id)
      } else {
        dropLinkFromCatalog(action.catalogId, action.from, action.to)
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
      } else {
        addLinkToCatalog(action.catalogId, action.from, action.to)
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
      }
    }

    const setViewMode = (mode: 'text' | 'card') => {
      viewMode.value = mode
      clearSelectionIfMissing()
    }

    const selectChapter = (id: number | null) => {
      currentChapterId.value = id
      if (id == null) return
      for (const catalog of currentCatalogList.value) {
        if (catalog.charpterList.some((chapter) => chapter.id === id)) {
          currentCatalogId.value = catalog.id
          return
        }
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
      currentCatalogId.value = id
      if (!isCard.value) return
      const catalog = currentCatalogList.value.find((item) => item.id === id)
      const stays = catalog?.charpterList.some((chapter) => chapter.id === currentChapterId.value)
      if (!stays) currentChapterId.value = null
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

    const creatChapter = (catalogId: number, options?: { pos?: { x: number; y: number } }) => {
      const target = currentCatalogList.value.find((c) => c.id === catalogId)
      if (!target) return
      const newId = createId()
      const newChapter: Chapter = {
        id: newId,
        name: isCard.value ? '未命名卡片' : '未命名章节',
        content: '',
      }
      if (isCard.value) {
        newChapter.pos = options?.pos ?? defaultCardPos(target.charpterList.length)
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
      }
    }

    const deleteChapter = (catalogId: number, chapterId: number) => {
      const target = currentCatalogList.value.find((c) => c.id === catalogId)
      if (!target) return
      target.charpterList = target.charpterList.filter((ch) => ch.id !== chapterId)
      if (target.links) {
        target.links = target.links.filter((link) => link.from !== chapterId && link.to !== chapterId)
      }
      if (currentChapterId.value === chapterId) {
        currentChapterId.value = null
      }
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

    return {
      currentWidth,
      isMenueResizing,
      viewMode,
      currentChapterId,
      currentCatalogId,
      isMenueExpanded,
      isText,
      isCard,
      currentCatalogList,
      currentCount,
      currentChapter,
      currentCatalog,
      getCatalogById,
      findChapter,
      setViewMode,
      selectChapter,
      revealChapter,
      searchHits,
      selectCatalog,
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
    }
  },
  {
    persist: {
      omit: ['isMenueResizing', 'canUndoBoard', 'canRedoBoard'],
      afterHydrate: (ctx) => {
        ctx.store.repairNextId()
        ctx.store.clearSelectionIfMissing()
        ctx.store.currentWidth = clampSidebarWidth(ctx.store.currentWidth)
      },
    },
  },
)
