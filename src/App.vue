<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppToast from './components/AppToast.vue'
import OfflineBanner from './components/OfflineBanner.vue'
import SwUpdatePrompt from './components/SwUpdatePrompt.vue'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>
  <AppToast />
  <OfflineBanner />
  <SwUpdatePrompt />
</template>
