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
      <h1>Boats</h1>
      <button class="back" @click="router.push('/settings')">⚙︎ Settings</button>
    </div>

    <div v-if="boatsStore.boats.length === 0" class="card center muted">
      No boats yet.<br />Add them in Settings.
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
      <button class="secondary" @click="router.push('/history')">List History</button>
    </div>
  </div>
</template>
