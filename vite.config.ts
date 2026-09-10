import { copyFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

const githubPages = () => ({
  name: 'github-pages-spa',
  closeBundle() {
    if (!process.env.BASE_PATH) return
    copyFileSync('dist/index.html', 'dist/404.html')
    writeFileSync('dist/.nojekyll', '')
  },
})

export default defineConfig(({ command }) => ({
  base: process.env.BASE_PATH || '/',
  plugins: [vue(), ...(command === 'serve' ? [vueDevTools()] : []), githubPages()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
