import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, getSettings, SETTINGS_ID, type Settings } from '../db/dexie'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings | null>(null)

  async function load() {
    settings.value = await getSettings()
    return settings.value
  }

  async function update(patch: Partial<Settings>) {
    await db.settings.update(SETTINGS_ID, patch)
    settings.value = await getSettings()
  }

  return { settings, load, update }
})
