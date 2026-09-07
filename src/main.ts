import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './router'
import { getSettings, db } from './db/dexie'
import { installCleanupHooks } from './db/cleanup'
import App from './App.vue'
import './styles.css'

async function bootstrap() {
  // DEV-only: подставить API-ключ из .env (VITE_CLAUDE_API_KEY), если он ещё не задан.
  // В production-сборку ключ НЕ попадает — на реальном телефоне вводится в Настройках.
  if (import.meta.env.DEV) {
    const envKey = import.meta.env.VITE_CLAUDE_API_KEY as string | undefined
    if (envKey) {
      const s = await getSettings()
      if (!s.apiKey) await db.settings.update(s.id, { apiKey: envKey })
    }
  }

  // Просим постоянное хранилище (чтобы IndexedDB не вычистили).
  if (navigator.storage?.persist) {
    try {
      const persisted = await navigator.storage.persist()
      const s = await getSettings()
      if (s.storagePersisted !== persisted) {
        await db.settings.update(s.id, { storagePersisted: persisted })
      }
    } catch {
      /* не критично */
    }
  }

  installCleanupHooks()

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

void bootstrap()
