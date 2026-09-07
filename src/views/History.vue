<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useListsStore } from '../stores/lists'
import { useBoatsStore } from '../stores/boats'
import { shareOrDownload } from '../lib/share'
import { humanDate, humanTime } from '../lib/formatters'
import type { PassengerList } from '../db/dexie'

const router = useRouter()
const listsStore = useListsStore()
const boatsStore = useBoatsStore()

const filterBoat = ref<number | 'all'>('all')

onMounted(async () => {
  await boatsStore.load()
  await listsStore.loadAll()
})

const filtered = computed(() =>
  filterBoat.value === 'all'
    ? listsStore.lists
    : listsStore.lists.filter((l) => l.boatId === filterBoat.value)
)

// группировка по дням (свежие сверху)
const grouped = computed(() => {
  const map = new Map<string, PassengerList[]>()
  for (const l of filtered.value) {
    const arr = map.get(l.date) ?? []
    arr.push(l)
    map.set(l.date, arr)
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
})

async function share(l: PassengerList) {
  await shareOrDownload(l.xlsxBlob, l.fileName)
}
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push('/')">‹ Лодки</button>
      <h1>История</h1>
      <span style="width: 60px"></span>
    </div>

    <label>Фильтр по лодке</label>
    <select v-model="filterBoat">
      <option value="all">Все лодки</option>
      <option v-for="b in boatsStore.boats" :key="b.id" :value="b.id">{{ b.name }}</option>
    </select>

    <div v-if="filtered.length === 0" class="card center muted" style="margin-top: 16px">
      Списков пока нет.
    </div>

    <div v-for="[date, lists] in grouped" :key="date" style="margin-top: 16px">
      <h3>{{ humanDate(date) }}</h3>
      <div v-for="l in lists" :key="l.id" class="card">
        <div class="row" style="justify-content: space-between">
          <b>{{ l.boatName }}</b>
          <span class="muted">{{ humanTime(l.createdAt) }}</span>
        </div>
        <div class="muted" style="font-size: 0.9rem; margin: 6px 0">
          Экипаж: {{ l.crewCount }} · Пассажиров: {{ l.passengerCount }}
        </div>
        <div class="row">
          <button style="width: auto" @click="share(l)">Поделиться</button>
          <button class="ghost" style="width: auto" @click="router.push(`/history/${l.id}`)">Открыть</button>
        </div>
      </div>
    </div>
  </div>
</template>
