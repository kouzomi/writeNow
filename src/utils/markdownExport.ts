import TurndownService from 'turndown'
import type { Catalog, Chapter } from '@/stores/shelf'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

const htmlToMarkdown = (html: string) => {
  const trimmed = html.trim()
  if (!trimmed) return ''
  return turndown.turndown(trimmed).trim()
}

const safeFileName = (name: string) => {
  const cleaned = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim()
  return cleaned || '未命名'
}

const downloadMarkdown = (filename: string, markdown: string) => {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${safeFileName(filename)}.md`
  link.click()
  URL.revokeObjectURL(url)
}

const chapterToMarkdown = (chapter: Chapter) => {
  const body = htmlToMarkdown(chapter.content)
  return body ? `## ${chapter.name}\n\n${body}` : `## ${chapter.name}`
}

const catalogToMarkdown = (catalog: Catalog) => {
  const chapters = catalog.charpterList.map(chapterToMarkdown).join('\n\n')
  return chapters ? `# ${catalog.name}\n\n${chapters}` : `# ${catalog.name}`
}

export const exportChapterMarkdown = (chapter: Chapter) => {
  const body = htmlToMarkdown(chapter.content)
  const markdown = body ? `# ${chapter.name}\n\n${body}` : `# ${chapter.name}`
  downloadMarkdown(chapter.name, markdown)
}

export const exportCatalogMarkdown = (catalog: Catalog) => {
  downloadMarkdown(catalog.name, catalogToMarkdown(catalog))
}
