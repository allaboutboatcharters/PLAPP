<script setup lang="ts">
import { ref } from 'vue'

const needRefresh = ref(false)
const registration = ref<ServiceWorkerRegistration | null>(null)

// vite-plugin-pwa injects `registerSW` via virtual module
async function initSW(): Promise<void> {
  const { registerSW } = await import('virtual:pwa-register')
  registerSW({
    onNeedRefresh() {
      needRefresh.value = true
    },
    onOfflineReady() {
      // silently ready
    },
    onRegisteredSW(_url, r) {
      registration.value = r ?? null
    }
  })
}

void initSW()

function reload(): void {
  window.location.reload()
}

function dismiss(): void {
  needRefresh.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="swprompt">
      <div v-if="needRefresh" class="sw-prompt">
        <span>New version available</span>
        <div class="row" style="gap: 8px; margin-top: 8px">
          <button style="width: auto" @click="reload">Reload</button>
          <button class="ghost" style="width: auto" @click="dismiss">Later</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sw-prompt {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 80px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2500;
  background: var(--surface);
  border: 1px solid var(--accent);
  border-radius: 14px;
  padding: 16px 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  max-width: 90vw;
}
.swprompt-enter-active, .swprompt-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.swprompt-enter-from, .swprompt-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
