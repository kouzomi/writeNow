import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ColorScheme = 'light' | 'dark'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const fontSize = ref(17)
    const showNotebook = ref(true)
    const colorScheme = ref<ColorScheme>('light')

    const setFontSize = (size: number) => {
      fontSize.value = size
    }

    const setShowNotebook = (value: boolean) => {
      showNotebook.value = value
    }

    const setColorScheme = (scheme: ColorScheme) => {
      colorScheme.value = scheme
    }

    return {
      fontSize,
      showNotebook,
      colorScheme,
      setFontSize,
      setShowNotebook,
      setColorScheme,
    }
  },
  {
    persist: true,
  },
)
