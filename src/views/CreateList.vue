<script setup lang="ts">
import { useRouter } from 'vue-router'
defineProps<{ id: string }>()
const router = useRouter()
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.back()">‹ Назад</button>
      <h1>Passenger list</h1>
      <span style="width: 60px"></span>
    </div>
    <div class="card center muted">Формирование списка — этап 5.</div>
  </div>
</template>
