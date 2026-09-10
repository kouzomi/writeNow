import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'
import { persistStorage, preparePersistStorage } from './utils/idbPersist'
import './styles/theme.css'

const bootstrap = async () => {
  await preparePersistStorage()

  const app = createApp(App)
  const pinia = createPinia()
  pinia.use(createPersistedState({ storage: persistStorage }))

  app.use(pinia)
  app.use(router)
  app.mount('#app')
}

void bootstrap()
