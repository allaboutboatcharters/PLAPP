<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { message, visible, hide } = useToast()
</script>

<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast-container" @click="hide">
        <div class="toast-body">{{ message }}</div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 24px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: auto;
}
.toast-body {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 0.95rem;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.toast-enter-active, .toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
