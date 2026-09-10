import { useNotebookStore } from '@/stores/notebook'
import { useSettingsStore } from '@/stores/settings'
import { useCatalogStore, type LibrarySnapshot } from '@/stores/shelf'
import { downloadTextFile, pickTextFile } from '@/utils/fileDownload'

export const BACKUP_STALE_MS = 3 * 24 * 60 * 60 * 1000

export const isBackupStale = (lastBackupAt: number | null | undefined) => {
  if (lastBackupAt == null) return true
  return Date.now() - lastBackupAt >= BACKUP_STALE_MS
}

export const formatBackupAt = (lastBackupAt: number | null | undefined) => {
  if (lastBackupAt == null) return '从未导出'
  return new Date(lastBackupAt).toLocaleString()
}

export const formatCloudSyncAt = (lastCloudSyncAt: number | null | undefined) => {
  if (lastCloudSyncAt == null) return '从未同步'
  return new Date(lastCloudSyncAt).toLocaleString()
}

export const hasWritableContent = () => {
  const catalog = useCatalogStore()
  const notebook = useNotebookStore()
  if (catalog.hasCatalogContent) return true
  const text = notebook.textContent.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length > 0
}

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

export const libraryContentKey = (backup: LibraryBackup) =>
  JSON.stringify({
    version: backup.version,
    textCatalogList: backup.textCatalogList,
    cardCatalogList: backup.cardCatalogList,
    nextId: backup.nextId,
    notebookContent: backup.notebookContent ?? '',
  })

export const backupHasContent = (backup: LibraryBackup) => {
  if (backup.textCatalogList.length > 0 || backup.cardCatalogList.length > 0) return true
  const text = (backup.notebookContent ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length > 0
}

export const packLibraryBackup = (): LibraryBackup => {
  const catalog = useCatalogStore()
  const notebook = useNotebookStore()
  return {
    ...catalog.getLibrarySnapshot(),
    notebookContent: notebook.textContent,
  }
}

export const applyLibraryBackup = (backup: LibraryBackup) => {
  const catalog = useCatalogStore()
  const notebook = useNotebookStore()
  catalog.replaceLibrary(backup)
  notebook.textContent = typeof backup.notebookContent === 'string' ? backup.notebookContent : ''
}

export const exportLibraryBackup = () => {
  const backup = packLibraryBackup()
  const stamp = new Date().toISOString().slice(0, 10)
  downloadTextFile(`writeNow-备份-${stamp}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8')
  useSettingsStore().markBackupNow()
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

  applyLibraryBackup(parsed)
  useSettingsStore().markBackupNow()
  return 'ok' as const
}
