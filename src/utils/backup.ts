import { useNotebookStore } from '@/stores/notebook'
import { useCatalogStore, type LibrarySnapshot } from '@/stores/shelf'
import { downloadTextFile, pickTextFile } from '@/utils/fileDownload'

export type LibraryBackup = LibrarySnapshot & {
  notebookContent?: string
}

const isChapter = (value: unknown) => {
  if (!value || typeof value !== 'object') return false
  const chapter = value as Record<string, unknown>
  return typeof chapter.id === 'number' && typeof chapter.name === 'string' && typeof chapter.content === 'string'
}

const isCatalog = (value: unknown) => {
  if (!value || typeof value !== 'object') return false
  const catalog = value as Record<string, unknown>
  return (
    typeof catalog.id === 'number' &&
    typeof catalog.name === 'string' &&
    Array.isArray(catalog.charpterList) &&
    catalog.charpterList.every(isChapter)
  )
}

export const isLibraryBackup = (value: unknown): value is LibraryBackup => {
  if (!value || typeof value !== 'object') return false
  const backup = value as Record<string, unknown>
  return (
    backup.version === 1 &&
    Array.isArray(backup.textCatalogList) &&
    backup.textCatalogList.every(isCatalog) &&
    Array.isArray(backup.cardCatalogList) &&
    backup.cardCatalogList.every(isCatalog) &&
    typeof backup.nextId === 'number'
  )
}

export const exportLibraryBackup = () => {
  const catalog = useCatalogStore()
  const notebook = useNotebookStore()
  const backup: LibraryBackup = {
    ...catalog.getLibrarySnapshot(),
    notebookContent: notebook.textContent,
  }
  const stamp = new Date().toISOString().slice(0, 10)
  downloadTextFile(`writeNow-备份-${stamp}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8')
}

export const importLibraryBackup = async () => {
  const text = await pickTextFile('.json,application/json')
  if (text == null) return 'cancelled' as const

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return 'invalid' as const
  }
  if (!isLibraryBackup(parsed)) return 'invalid' as const

  const catalog = useCatalogStore()
  const notebook = useNotebookStore()
  catalog.replaceLibrary(parsed)
  if (typeof parsed.notebookContent === 'string') {
    notebook.textContent = parsed.notebookContent
  }
  return 'ok' as const
}
