import { marked } from 'marked'

export type ImportedChapter = {
  name: string
  markdown: string
}

export type ImportedVolume = {
  name: string
  chapters: ImportedChapter[]
}

const markdownToHtml = (markdown: string) => {
  const trimmed = markdown.trim()
  if (!trimmed) return ''
  return String(marked.parse(trimmed, { async: false }))
}

const splitByHeading = (markdown: string, level: 1 | 2) => {
  const prefix = level === 1 ? '# ' : '## '
  const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/)
  const blocks: { name: string; body: string }[] = []
  let current: { name: string; lines: string[] } | null = null
  const prelude: string[] = []

  const pushCurrent = () => {
    if (!current) return
    blocks.push({ name: current.name, body: current.lines.join('\n').trim() })
    current = null
  }

  for (const line of lines) {
    const isHeading = line.startsWith(prefix) && (level === 2 || !line.startsWith('## '))
    if (!isHeading) {
      if (current) current.lines.push(line)
      else prelude.push(line)
      continue
    }
    pushCurrent()
    current = { name: line.slice(prefix.length).trim() || '未命名', lines: [] }
  }
  pushCurrent()

  if (blocks.length === 0 && markdown.trim()) {
    return [{ name: '导入章节', body: markdown.trim() }]
  }
  const first = blocks[0]
  if (prelude.join('\n').trim() && first) {
    first.body = [prelude.join('\n').trim(), first.body].filter(Boolean).join('\n\n')
  }
  return blocks
}

export const parseMarkdownArchive = (markdown: string) => {
  const volumes: ImportedVolume[] = []
  const chapters: ImportedChapter[] = []
  const h1Blocks = splitByHeading(markdown, 1)

  for (const block of h1Blocks) {
    const h2Blocks = splitByHeading(block.body, 2)
    const hasExplicitChapters = /^## /m.test(block.body)
    if (hasExplicitChapters) {
      volumes.push({
        name: block.name,
        chapters: h2Blocks.map((item) => ({ name: item.name, markdown: item.body })),
      })
    } else {
      chapters.push({ name: block.name, markdown: block.body })
    }
  }

  return { volumes, chapters }
}

export const toStoredChapters = (chapters: ImportedChapter[]) =>
  chapters.map((chapter) => ({
    name: chapter.name,
    content: markdownToHtml(chapter.markdown),
  }))

export const toStoredVolumes = (volumes: ImportedVolume[]) =>
  volumes.map((volume) => ({
    name: volume.name,
    chapters: toStoredChapters(volume.chapters),
  }))
