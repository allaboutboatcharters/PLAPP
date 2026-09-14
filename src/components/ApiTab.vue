<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()

const apiKey = ref('')
const model = ref('claude-sonnet-5')

async function saveApi(): Promise<void> {
  await settingsStore.update({ apiKey: apiKey.value.trim(), model: model.value.trim() })
}

async function init(): Promise<void> {
  const s = await settingsStore.load()
  apiKey.value = s.apiKey
  model.value = s.model
}

void init()
</script>

<template>
  <section>
    <div class="card stack">
      <div>
        <label>Anthropic API key</label>
        <input v-model="apiKey" type="password" placeholder="sk-ant-..." autocomplete="off" />
      </div>
      <div>
        <label>Model</label>
        <input v-model="model" />
      </div>
      <button @click="saveApi">Save</button>
      <p class="muted" style="font-size: 0.8rem">
        Key is stored only on this device (IndexedDB) and used for direct requests to api.anthropic.com.
        ⚠️ The key is NOT encrypted — anyone with access to this device can read it via browser DevTools.
      </p>
    </div>
  </section>
</template>
