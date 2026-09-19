import type { Chapter } from '@/stores/shelf'

export const sameCardParent = (a?: number | null, b?: number | null) =>
  (a ?? null) === (b ?? null)

export const isRootCard = (chapter: Chapter) => chapter.parentId == null

export const childrenOf = (chapters: Chapter[], parentId: number | null) =>
  chapters.filter((chapter) => sameCardParent(chapter.parentId, parentId))

export const childCountOf = (chapters: Chapter[], parentId: number) =>
  chapters.reduce((count, chapter) => count + (chapter.parentId === parentId ? 1 : 0), 0)

/** 收集自身与全部子孙 id（用于级联删除） */
export const collectSubtreeIds = (chapters: Chapter[], rootIds: number[]) => {
  const byParent = new Map<number | null, Chapter[]>()
  for (const chapter of chapters) {
    const key = chapter.parentId ?? null
    const list = byParent.get(key)
    if (list) list.push(chapter)
    else byParent.set(key, [chapter])
  }
  const result = new Set<number>()
  const stack = [...rootIds]
  while (stack.length > 0) {
    const id = stack.pop()
    if (id == null || result.has(id)) continue
    result.add(id)
    const kids = byParent.get(id)
    if (!kids) continue
    for (const kid of kids) stack.push(kid.id)
  }
  return result
}

export type TreeChapter = { chapter: Chapter; depth: number }

/** 深度优先，便于侧栏缩进展示 */
export const flattenCardTree = (chapters: Chapter[]): TreeChapter[] => {
  const result: TreeChapter[] = []
  const walk = (parentId: number | null, depth: number) => {
    for (const chapter of childrenOf(chapters, parentId)) {
      result.push({ chapter, depth })
      walk(chapter.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
}

export const breadcrumbFor = (chapters: Chapter[], parentId: number | null): Chapter[] => {
  if (parentId == null) return []
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]))
  const path: Chapter[] = []
  let current: number | null = parentId
  const guard = new Set<number>()
  while (current != null && !guard.has(current)) {
    guard.add(current)
    const chapter = byId.get(current)
    if (!chapter) break
    path.unshift(chapter)
    current = chapter.parentId ?? null
  }
  return path
}
