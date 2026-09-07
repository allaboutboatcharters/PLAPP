<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoatsStore } from '../stores/boats'

const router = useRouter()
const boatsStore = useBoatsStore()

onMounted(() => boatsStore.load())
</script>

<template>
  <div>
    <div class="topbar">
      <h1>Лодки</h1>
      <button class="back" @click="router.push('/settings')">⚙︎ Настройки</button>
    </div>

    <div v-if="boatsStore.boats.length === 0" class="card center muted">
      Лодок пока нет.<br />Добавьте их в разделе «Настройки».
    </div>

    <div class="grid">
      <button
        v-for="b in boatsStore.boats"
        :key="b.id"
        class="tile"
        @click="router.push(`/boat/${b.id}`)"
      >
        {{ b.name }}
      </button>
    </div>

    <div style="margin-top: 20px">
      <button class="secondary" @click="router.push('/history')">История списков</button>
    </div>
  </div>
</template>
