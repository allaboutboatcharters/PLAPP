<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useListsStore } from '../stores/lists'
import { shareOrDownload } from '../lib/share'
import { humanDate, humanTime } from '../lib/formatters'
import type { PassengerList, ListRow } from '../db/dexie'

const props = defineProps<{ listId: string }>()
const router = useRouter()
const listsStore = useListsStore()

const list = ref<PassengerList | null>(null)

onMounted(async () => {
  list.value = (await listsStore.get(Number(props.listId))) ?? null
})

const allRows = computed<ListRow[]>(() =>
  list.value ? [...list.value.crewRows, ...list.value.passengers] : []
)

async function share() {
  if (list.value) await shareOrDownload(list.value.xlsxBlob, list.value.fileName)
}

async function remove() {
  if (!list.value) return
  if (!confirm('Delete this list permanently?')) return
  await listsStore.remove(list.value.id!)
  router.push('/history')
}
</script>

<template>
  <div v-if="list">
    <div class="topbar">
      <button class="back" @click="router.push('/history')">‹ History</button>
      <h1>List</h1>
      <span style="width: 60px"></span>
    </div>

    <div class="card">
      <b>{{ list.boatName }}</b>
      <div class="muted">{{ humanDate(list.date) }} · {{ humanTime(list.createdAt) }}</div>
      <div class="muted">Crew: {{ list.crewCount }} · Passengers: {{ list.passengerCount }}</div>
    </div>

    <button @click="share">Share / Download</button>

    <div class="card" style="overflow-x: auto; margin-top: 12px">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem">
        <thead>
          <tr style="text-align: left">
            <th>#</th><th>Last Name</th><th>First Name</th><th>Rank</th><th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in allRows" :key="i" style="border-top: 1px solid var(--border)">
            <td>{{ r.seq }}</td>
            <td>{{ r.lastName }}</td>
            <td>{{ r.firstName }}</td>
            <td>{{ r.rank }}</td>
            <td>{{ r.remark }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button class="danger" style="margin-top: 12px" @click="remove">Delete list</button>
  </div>
</template>
