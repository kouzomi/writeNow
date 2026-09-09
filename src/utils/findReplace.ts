import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

export type TextMatch = { from: number; to: number }
export type LocatedMatch = { chapterId: number; match: TextMatch }

let scratchEditor: Editor | null = null

const getScratchEditor = () => {
  if (!scratchEditor) {
    scratchEditor = new Editor({
      extensions: [StarterKit],
      content: '',
      editable: true,
    })
  }
  return scratchEditor
}

const editorForHtml = (html: string) => {
  const editor = getScratchEditor()
  editor.commands.setContent(html || '', { emitUpdate: false })
  return editor
}

type EditorLike = {
  state: {
    doc: {
      descendants: (fn: (node: { isText: boolean; text?: string }, pos: number) => void) => void
    }
  }
  chain: () => {
    focus: () => {
      setTextSelection: (range: TextMatch) => { scrollIntoView: () => { run: () => boolean } }
      deleteRange: (range: TextMatch) => { run: () => boolean }
      insertContentAt: (range: TextMatch, value: string) => { run: () => boolean }
    }
  }
}

export const collectMatches = (editor: EditorLike, query: string): TextMatch[] => {
  if (!query) return []

  const matches: TextMatch[] = []
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const haystack = node.text
    let start = 0
    while (start < haystack.length) {
      const index = haystack.indexOf(query, start)
      if (index === -1) break
      matches.push({ from: pos + index, to: pos + index + query.length })
      start = index + query.length
    }
  })
  return matches
}

export const selectMatch = (editor: EditorLike, match: TextMatch) => {
  editor.chain().focus().setTextSelection(match).scrollIntoView().run()
}

export const replaceMatch = (editor: EditorLike, match: TextMatch, replacement: string) => {
  if (replacement === '') {
    editor.chain().focus().deleteRange(match).run()
    return
  }
  editor.chain().focus().insertContentAt(match, replacement).run()
}

export const replaceAllMatches = (editor: EditorLike, matches: TextMatch[], replacement: string) => {
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i]
    if (match) replaceMatch(editor, match, replacement)
  }
}

export const collectVolumeMatches = (
  chapters: { id: number; content: string }[],
  query: string,
  live?: { chapterId: number; editor: EditorLike },
): LocatedMatch[] => {
  if (!query) return []
  const located: LocatedMatch[] = []
  for (const chapter of chapters) {
    const editor =
      live && live.chapterId === chapter.id ? live.editor : editorForHtml(chapter.content)
    for (const match of collectMatches(editor, query)) {
      located.push({ chapterId: chapter.id, match })
    }
  }
  return located
}

export const replaceAllInVolume = (
  chapters: { id: number; content: string }[],
  query: string,
  replacement: string,
  live?: { chapterId: number; editor: EditorLike },
  writeChapter?: (id: number, html: string) => void,
) => {
  if (!query) return
  for (const chapter of chapters) {
    if (live && live.chapterId === chapter.id) {
      replaceAllMatches(live.editor, collectMatches(live.editor, query), replacement)
      continue
    }
    const editor = editorForHtml(chapter.content)
    const matches = collectMatches(editor, query)
    if (matches.length === 0) continue
    replaceAllMatches(editor, matches, replacement)
    writeChapter?.(chapter.id, editor.getHTML())
  }
}
