<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const offline = ref(!navigator.onLine)

function onOnline() { offline.value = false }
function onOffline() { offline.value = true }

onMounted(() => {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', onOnline)
  window.removeEventListener('offline', onOffline)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="banner">
      <div v-if="offline" class="offline-banner">
        📡 Offline — only local data available
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.offline-banner {
  position: fixed;
  top: env(safe-area-inset-top);
  left: 0;
  right: 0;
  z-index: 3000;
  background: var(--danger);
  color: #fff;
  text-align: center;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
}
.banner-enter-active, .banner-leave-active {
  transition: transform 0.3s;
}
.banner-enter-from, .banner-leave-to {
  transform: translateY(-100%);
}
</style>
