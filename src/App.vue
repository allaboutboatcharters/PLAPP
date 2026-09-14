<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppToast from './components/AppToast.vue'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>
  <AppToast />
</template>
