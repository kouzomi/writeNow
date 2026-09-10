import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ColorScheme = 'light' | 'dark'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const fontSize = ref(17)
    const showNotebook = ref(true)
    const colorScheme = ref<ColorScheme>('light')
    const lastBackupAt = ref<number | null>(null)
    const cloudEnabled = ref(false)
    const cloudAccountName = ref<string | null>(null)
    const lastCloudSyncAt = ref<number | null>(null)
    const lastSyncedEtag = ref<string | null>(null)
    const lastSyncedContentKey = ref<string | null>(null)

    const setFontSize = (size: number) => {
      fontSize.value = size
    }

    const setShowNotebook = (value: boolean) => {
      showNotebook.value = value
    }

    const setColorScheme = (scheme: ColorScheme) => {
      colorScheme.value = scheme
    }

    const markBackupNow = () => {
      lastBackupAt.value = Date.now()
    }

    const markCloudSynced = (etag: string, contentKey: string) => {
      lastSyncedEtag.value = etag
      lastSyncedContentKey.value = contentKey
      lastCloudSyncAt.value = Date.now()
    }

    const clearCloudSession = () => {
      cloudEnabled.value = false
      cloudAccountName.value = null
      lastCloudSyncAt.value = null
      lastSyncedEtag.value = null
      lastSyncedContentKey.value = null
    }

    return {
      fontSize,
      showNotebook,
      colorScheme,
      lastBackupAt,
      cloudEnabled,
      cloudAccountName,
      lastCloudSyncAt,
      lastSyncedEtag,
      lastSyncedContentKey,
      setFontSize,
      setShowNotebook,
      setColorScheme,
      markBackupNow,
      markCloudSynced,
      clearCloudSession,
    }
  },
  {
    persist: true,
  },
)
