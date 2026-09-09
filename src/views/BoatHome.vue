<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBoatsStore } from '../stores/boats'
import { useScansStore } from '../stores/scans'

const props = defineProps<{ id: string }>()
const router = useRouter()
const boatsStore = useBoatsStore()
const scansStore = useScansStore()

const boatName = ref('')
const readyCount = ref(0)

onMounted(async () => {
  const boatId = Number(props.id)
  const boat = await boatsStore.get(boatId)
  boatName.value = boat?.name ?? 'Boat'
  readyCount.value = await scansStore.readyCount(boatId)
})
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push('/')">‹ Boats</button>
      <h1>{{ boatName }}</h1>
      <span style="width: 60px"></span>
    </div>

    <div class="stack">
      <button @click="router.push(`/boat/${id}/capture`)">📷 Add passport</button>
      <button @click="router.push(`/boat/${id}/new-list`)">
        📋 Create Passenger List
        <span v-if="readyCount" class="badge">{{ readyCount }}</span>
      </button>
      <button class="secondary" @click="router.push('/history')">🕘 History</button>
    </div>

    <p class="muted center" style="margin-top: 16px">
      Ready scans for this boat: {{ readyCount }}
    </p>
  </div>
</template>
