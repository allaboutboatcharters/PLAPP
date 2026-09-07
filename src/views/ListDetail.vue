<script setup lang="ts">
import { useRouter } from 'vue-router'
defineProps<{ listId: string }>()
const router = useRouter()
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push('/history')">‹ История</button>
      <h1>Список</h1>
      <span style="width: 60px"></span>
    </div>
    <div class="card center muted">Детали списка — этап 6.</div>
  </div>
</template>
