<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useScansStore } from '../stores/scans'
import { useListsStore } from '../stores/lists'
import { buildPassengerListWorkbook } from '../lib/passengerListWorkbook'
import { shareOrDownload } from '../lib/share'
import type { PassengerList, PassportScan, ListRow } from '../db/dexie'

const props = defineProps<{ listId: string }>()
const router = useRouter()
const scansStore = useScansStore()
const listsStore = useListsStore()

const list = ref<PassengerList | null>(null)
const candidates = ref<PassportScan[]>([])
const selected = ref<Set<number>>(new Set())

type Phase = 'select' | 'done'
const phase = ref<Phase>('select')
const adding = ref(false)
const errorMsg = ref('')
let generatedBlob: Blob | null = null
let generatedName = ''

onMounted(async () => {
  const l = await listsStore.get(Number(props.listId))
  if (!l) { router.push('/history'); return }
  list.value = l
  generatedName = l.fileName

  // Get scans that are ready for this boat, excluding those already in THIS list
  const existingNumbers = new Set(l.passengers.map(p => p.passportNumber.trim()))
  const allForBoat = await scansStore.loadForBoat(l.boatId)
  const unusedReady = allForBoat.filter(s =>
    s.status === 'ready' &&
    !existingNumbers.has(s.extracted.passportNumber.trim()) &&
    (s.usedInListId == null || s.usedInListId === l.id)
  )
  candidates.value = unusedReady
  selected.value = new Set(unusedReady.map(s => s.id!))
})

function toggle(id: number) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}

function scanToRow(s: PassportScan): ListRow {
  const e = s.extracted
  return {
    seq: 0, rank: 'Passenger', remark: s.remark,
    lastName: e.lastName, firstName: e.firstName, dateOfBirth: e.dateOfBirth,
    placeOfBirth: e.placeOfBirth, nationality: e.nationality,
    issueDate: e.issueDate, expirationDate: e.expirationDate, passportNumber: e.passportNumber
  }
}

const canAdd = computed(() => selected.value.size > 0)

async function addPassengers() {
  if (!list.value || !canAdd.value) return
  errorMsg.value = ''
  adding.value = true
  try {
    const l = list.value
    const chosen = candidates.value.filter(s => selected.value.has(s.id!))

    // Dedupe by passport number (also against existing passengers)
    const existingNumbers = new Set(l.passengers.map(p => p.passportNumber.trim()))
    const newPassengers: ListRow[] = []
    for (const s of chosen) {
      const num = s.extracted.passportNumber.trim()
      if (num && existingNumbers.has(num)) continue
      existingNumbers.add(num)
      newPassengers.push(scanToRow(s))
    }

    if (newPassengers.length === 0) {
      errorMsg.value = 'All selected passengers are already in the list.'
      adding.value = false
      return
    }

    // Merge with existing passengers, re-number
    const allPassengers = [...l.passengers, ...newPassengers]
    allPassengers.forEach((r, i) => (r.seq = i + 1))

    // Rebuild XLSX
    const blob = await buildPassengerListWorkbook(l.crewRows, allPassengers)

    // Update the list in DB
    await listsStore.update(l.id!, {
      passengers: allPassengers,
      passengerCount: allPassengers.length,
      xlsxBlob: blob
    })

    // Mark scans as used
    for (const s of chosen) {
      if (s.id != null) await scansStore.update(s.id, { usedInListId: l.id! })
    }

    generatedBlob = blob
    phase.value = 'done'
  } catch (err) {
    errorMsg.value = (err as Error).message
  } finally {
    adding.value = false
  }
}

async function share() {
  if (generatedBlob) await shareOrDownload(generatedBlob, generatedName)
}
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push(`/history/${listId}`)">‹ Back</button>
      <h1>Add passengers</h1>
      <span style="width: 60px"></span>
    </div>

    <div v-if="phase === 'select'" class="stack">
      <div v-if="list" class="card">
        <b>{{ list.boatName }}</b>
        <div class="muted">Current passengers: {{ list.passengerCount }}</div>
      </div>

      <h3>New passengers ({{ selected.size }} of {{ candidates.length }})</h3>
      <div v-if="candidates.length === 0" class="card muted center">
        No new scans available. Add more passports first.
      </div>
      <label v-for="s in candidates" :key="s.id" class="card row" style="cursor: pointer">
        <input
          type="checkbox"
          style="width: auto; min-height: auto"
          :checked="selected.has(s.id!)"
          @change="toggle(s.id!)"
        />
        <div>
          <b>{{ s.extracted.lastName }} {{ s.extracted.firstName }}</b>
          <div class="muted" style="font-size: 0.85rem">
            {{ s.extracted.passportNumber }} · {{ s.remark || '— no accommodation —' }}
          </div>
        </div>
      </label>

      <div v-if="errorMsg" class="card" style="border-color: var(--danger)">{{ errorMsg }}</div>
      <button :disabled="!canAdd || adding" @click="addPassengers">
        {{ adding ? 'Adding…' : `Add ${selected.size} passenger(s)` }}
      </button>
    </div>

    <div v-else class="stack">
      <div class="card center">
        <p>✅ Passengers added</p>
        <p class="muted">{{ generatedName }}</p>
      </div>
      <button @click="share">Share / Download</button>
      <button class="secondary" @click="router.push(`/history/${listId}`)">Back to list</button>
      <button class="ghost" @click="router.push('/history')">To history</button>
    </div>
  </div>
</template>
