<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBoatsStore } from '../stores/boats'
import { useCrewStore } from '../stores/crew'
import { useScansStore } from '../stores/scans'
import { useSettingsStore } from '../stores/settings'
import { useListsStore } from '../stores/lists'
import { buildPassengerListWorkbook } from '../lib/passengerListWorkbook'
import { shareOrDownload } from '../lib/share'
import { todayISO } from '../lib/formatters'
import type { Crew, ListRow, PassportScan } from '../db/dexie'

const props = defineProps<{ id: string }>()
const router = useRouter()
const boatsStore = useBoatsStore()
const crewStore = useCrewStore()
const scansStore = useScansStore()
const settingsStore = useSettingsStore()
const listsStore = useListsStore()

const boatId = Number(props.id)
const boatName = ref('')
const captains = ref<Crew[]>([])
const assistants = ref<Crew[]>([])
const captainId = ref<number | null>(null)
const assistantId = ref<number | null>(null)

const candidates = ref<PassportScan[]>([])
const selected = ref<Set<number>>(new Set())

type Phase = 'select' | 'done'
const phase = ref<Phase>('select')
const generating = ref(false)
const errorMsg = ref('')
let generatedBlob: Blob | null = null
let generatedName = 'Crew and Passenger List.xlsx'

const canGenerate = computed(() => captainId.value != null && assistantId.value != null)

onMounted(async () => {
  const boat = await boatsStore.get(boatId)
  boatName.value = boat?.name ?? 'Boat'
  await crewStore.load()
  captains.value = crewStore.byRole('captain')
  assistants.value = crewStore.byRole('assistant')
  captainId.value = captains.value[0]?.id ?? null
  assistantId.value = assistants.value[0]?.id ?? null
  await loadCandidates()
})

async function loadCandidates() {
  const date = todayISO()
  const usedNumbers = await listsStore.usedPassportNumbers(boatId, date)
  const all = await scansStore.candidatesForBoat(boatId)
  // дедуп по номеру паспорта: исключаем тех, кто уже в списке этой лодки за сегодня
  candidates.value = all.filter((s) => !usedNumbers.has(s.extracted.passportNumber.trim()))
  selected.value = new Set(candidates.value.map((s) => s.id!))
}

function toggle(id: number) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}

function crewToRow(c: Crew, rank: string): ListRow {
  return {
    seq: 0, rank, remark: c.remark || 'SXM',
    lastName: c.lastName, firstName: c.firstName, dateOfBirth: c.dateOfBirth,
    placeOfBirth: c.placeOfBirth, nationality: c.nationality,
    issueDate: c.issueDate, expirationDate: c.expirationDate, passportNumber: c.passportNumber
  }
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

async function generate() {
  if (!canGenerate.value) return
  errorMsg.value = ''
  generating.value = true
  try {
    const captain = captains.value.find((c) => c.id === captainId.value)!
    const assistant = assistants.value.find((c) => c.id === assistantId.value)!
    const crewRows: ListRow[] = [crewToRow(captain, 'CAPTAIN'), crewToRow(assistant, 'CREW')]

    const chosen = candidates.value.filter((s) => selected.value.has(s.id!))
    // дедуп по номеру паспорта внутри выборки
    const seen = new Set<string>()
    const passengers: ListRow[] = []
    for (const s of chosen) {
      const num = s.extracted.passportNumber.trim()
      if (num && seen.has(num)) continue
      seen.add(num)
      passengers.push(scanToRow(s))
    }
    crewRows.forEach((r, i) => (r.seq = i + 1))
    passengers.forEach((r, i) => (r.seq = i + 1))

    const blob = await buildPassengerListWorkbook(crewRows, passengers)
    const s = await settingsStore.load()
    generatedName = `${s.filenamePrefix}.xlsx`
    generatedBlob = blob

    const listId = await listsStore.save({
      boatId, boatName: boatName.value, date: todayISO(), createdAt: Date.now(),
      captainId: captainId.value, assistantId: assistantId.value,
      crewRows, passengers,
      crewCount: crewRows.length, passengerCount: passengers.length,
      fileName: generatedName, xlsxBlob: blob
    })

    // пометить использованные сканы
    for (const s2 of chosen) {
      if (s2.id != null) await scansStore.update(s2.id, { usedInListId: listId })
    }
    phase.value = 'done'
  } catch (err) {
    errorMsg.value = (err as Error).message
  } finally {
    generating.value = false
  }
}

async function share() {
  if (generatedBlob) await shareOrDownload(generatedBlob, generatedName)
}
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push(`/boat/${id}`)">‹ {{ boatName }}</button>
      <h1>Passenger list</h1>
      <span style="width: 60px"></span>
    </div>

    <div v-if="phase === 'select'" class="stack">
      <div class="card stack">
        <div>
          <label>Captain (CAPTAIN)</label>
          <select v-model="captainId">
            <option v-for="c in captains" :key="c.id" :value="c.id">{{ c.lastName }} {{ c.firstName }}</option>
          </select>
        </div>
        <div>
          <label>Assistant (CREW)</label>
          <select v-model="assistantId">
            <option v-for="c in assistants" :key="c.id" :value="c.id">{{ c.lastName }} {{ c.firstName }}</option>
          </select>
        </div>
        <p v-if="captains.length === 0 || assistants.length === 0" class="muted">
          First add captains and assistants in Settings.
        </p>
      </div>

      <h3>Passengers ({{ selected.size }} of {{ candidates.length }})</h3>
      <div v-if="candidates.length === 0" class="card muted center">
        No ready scans for this boat. Add passports.
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
            {{ s.extracted.passportNumber }} · {{ s.remark || '— no accommodation specified —' }}
          </div>
        </div>
      </label>

      <div v-if="errorMsg" class="card" style="border-color: var(--danger)">{{ errorMsg }}</div>
      <button :disabled="!canGenerate || generating" @click="generate">
        {{ generating ? 'Generating…' : 'Generate' }}
      </button>
    </div>

    <div v-else class="stack">
      <div class="card center">
        <p>✅ List generated</p>
        <p class="muted">{{ generatedName }}</p>
      </div>
      <button @click="share">Share / Download</button>
      <button class="secondary" @click="router.push('/history')">To history</button>
      <button class="ghost" @click="router.push(`/boat/${id}`)">Done</button>
    </div>
  </div>
</template>
