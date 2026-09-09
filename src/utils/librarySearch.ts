const SNIPPET_PAD = 18
const MAX_HITS = 40

type SearchableChapter = { id: number; name: string; content: string }
type SearchableCatalog = { id: number; name: string; charpterList: SearchableChapter[] }

export type LibrarySearchHit = {
  mode: 'text' | 'card'
  catalogId: number
  catalogName: string
  chapterId: number
  chapterName: string
  snippet: string
}

export const htmlToPlainText = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(?:p|div|h[1-6]|li)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()

const excerptAround = (text: string, query: string) => {
  const lower = text.toLowerCase()
  const needle = query.toLowerCase()
  const index = lower.indexOf(needle)
  if (index === -1) return text.slice(0, 48)
  const start = Math.max(0, index - SNIPPET_PAD)
  const end = Math.min(text.length, index + needle.length + SNIPPET_PAD)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

const scanCatalogs = (
  mode: 'text' | 'card',
  catalogs: SearchableCatalog[],
  needle: string,
  original: string,
  hits: LibrarySearchHit[],
) => {
  for (const catalog of catalogs) {
    for (const chapter of catalog.charpterList) {
      if (hits.length >= MAX_HITS) return
      const title = chapter.name || ''
      const body = htmlToPlainText(chapter.content || '')
      const titleHit = title.toLowerCase().includes(needle)
      const bodyHit = body.toLowerCase().includes(needle)
      if (!titleHit && !bodyHit) continue
      hits.push({
        mode,
        catalogId: catalog.id,
        catalogName: catalog.name,
        chapterId: chapter.id,
        chapterName: title,
        snippet: titleHit ? title : excerptAround(body, original),
      })
    }
  }
}

export const searchLibrary = (
  textCatalogs: SearchableCatalog[],
  cardCatalogs: SearchableCatalog[],
  query: string,
): LibrarySearchHit[] => {
  const original = query.trim()
  const needle = original.toLowerCase()
  if (!needle) return []
  const hits: LibrarySearchHit[] = []
  scanCatalogs('text', textCatalogs, needle, original, hits)
  scanCatalogs('card', cardCatalogs, needle, original, hits)
  return hits
}
