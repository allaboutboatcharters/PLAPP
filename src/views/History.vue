<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push('/')">‹ Лодки</button>
      <h1>История</h1>
      <span style="width: 60px"></span>
    </div>
    <div class="card center muted">История списков — этап 6.</div>
  </div>
</template>
