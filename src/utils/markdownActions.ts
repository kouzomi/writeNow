import { useCatalogStore } from '@/stores/shelf'
import { pickTextFile } from '@/utils/fileDownload'
import {
  parseMarkdownArchive,
  toStoredChapters,
  toStoredVolumes,
} from '@/utils/markdownImport'

export const importMarkdownFile = async () => {
  const text = await pickTextFile('.md,text/markdown,text/plain')
  if (text == null) return

  const store = useCatalogStore()
  const parsed = parseMarkdownArchive(text)
  const volumes = toStoredVolumes(parsed.volumes)
  const chapters = toStoredChapters(parsed.chapters)

  if (volumes.length === 0 && chapters.length === 0) {
    alert('文件里没有可读的标题或正文')
    return
  }

  let addedVolumes = 0
  let addedChapters = 0

  if (volumes.length > 0) {
    store.importVolumes(volumes)
    addedVolumes += volumes.length
    addedChapters += volumes.reduce((sum, volume) => sum + volume.chapters.length, 0)
  }

  if (chapters.length > 0) {
    addedChapters += chapters.length
    if (store.currentCatalogId == null) {
      store.importVolumes([{ name: '导入', chapters }])
      addedVolumes += 1
    } else {
      store.importChapters(store.currentCatalogId, chapters)
    }
  }

  alert(`已导入 ${addedVolumes} 卷、${addedChapters} 章`)
}
