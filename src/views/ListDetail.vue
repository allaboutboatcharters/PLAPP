<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useListsStore } from '../stores/lists'
import { buildPassengerListWorkbook } from '../lib/passengerListWorkbook'
import { shareOrDownload } from '../lib/share'
import { savePdf } from '../lib/savePdf'
import { cloneRows } from '../lib/listHelpers'
import { humanDate, humanTime } from '../lib/formatters'
import type { PassengerList, ListRow, ExtractedPassport } from '../db/dexie'

const props = defineProps<{ listId: string }>()
const router = useRouter()
const listsStore = useListsStore()

const list = ref<PassengerList | null>(null)

onMounted(async () => {
  list.value = (await listsStore.get(Number(props.listId))) ?? null
})

async function share(): Promise<void> {
  if (list.value) await shareOrDownload(list.value.xlsxBlob, list.value.fileName)
}

async function remove(): Promise<void> {
  if (!list.value) return
  if (!confirm('Delete this list permanently?')) return
  await listsStore.remove(list.value.id!)
  router.push('/history')
}

// --- Edit passenger/crew row ---
const editFields: { key: keyof ExtractedPassport; label: string }[] = [
  { key: 'lastName', label: 'Last Name' },
  { key: 'firstName', label: 'First Name' },
  { key: 'dateOfBirth', label: 'Date of Birth (DD.MM.YYYY)' },
  { key: 'placeOfBirth', label: 'Place of Birth' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'issueDate', label: 'Issue Date (DD.MM.YYYY)' },
  { key: 'expirationDate', label: 'Expiration Date (DD.MM.YYYY)' },
  { key: 'passportNumber', label: 'Passport Number' }
]

type EditTarget = { type: 'crew' | 'passenger'; index: number }
const editTarget = ref<EditTarget | null>(null)
const editRow = ref<ListRow | null>(null)
const saving = ref(false)

function openEditRow(type: 'crew' | 'passenger', index: number): void {
  const l = list.value
  if (!l) return
  const source = type === 'crew' ? l.crewRows : l.passengers
  const row = source[index]
  if (!row) return
  editTarget.value = { type, index }
  // Deep clone to avoid mutating list directly
  editRow.value = {
    seq: row.seq, rank: row.rank, remark: row.remark,
    lastName: row.lastName, firstName: row.firstName, dateOfBirth: row.dateOfBirth,
    placeOfBirth: row.placeOfBirth, nationality: row.nationality,
    issueDate: row.issueDate, expirationDate: row.expirationDate, passportNumber: row.passportNumber
  }
}

function closeEdit(): void {
  editTarget.value = null
  editRow.value = null
}

async function saveEdit(): Promise<void> {
  const l = list.value
  const target = editTarget.value
  const row = editRow.value
  if (!l || !target || !row || saving.value) return

  saving.value = true
  try {
    const crewRows = cloneRows(l.crewRows)
    const passengers = cloneRows(l.passengers)

    if (target.type === 'crew') {
      crewRows[target.index] = { ...row }
    } else {
      passengers[target.index] = { ...row }
    }

    // Rebuild XLSX
    const blob = await buildPassengerListWorkbook(crewRows, passengers, l.boatName)

    await listsStore.update(l.id!, {
      crewRows,
      passengers,
      xlsxBlob: blob
    })

    // Refresh local data
    list.value = (await listsStore.get(l.id!)) ?? null
    closeEdit()
  } finally {
    saving.value = false
  }
}

function getField(row: ListRow, key: keyof ExtractedPassport): string {
  return row[key]
}
function setField(row: ListRow, key: keyof ExtractedPassport, value: string): void {
  ;(row as Record<keyof ExtractedPassport, string>)[key] = value
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
    <button class="secondary" style="margin-top: 8px" @click="savePdf(list.boatName, list.crewRows, list.passengers)">📄 Save PDF</button>
    <button class="secondary" style="margin-top: 8px" @click="router.push(`/history/${listId}/add`)">+ Add passengers</button>

    <div class="card" style="overflow-x: auto; margin-top: 12px">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem">
        <thead>
          <tr style="text-align: left">
            <th>#</th><th>Last Name</th><th>First Name</th><th>Rank</th><th>Remarks</th><th></th>
          </tr>
        </thead>
        <tbody>
          <!-- Crew rows -->
          <tr
            v-for="(r, i) in list.crewRows"
            :key="'crew-' + i"
            style="border-top: 1px solid var(--border); cursor: pointer"
            @click="openEditRow('crew', i)"
          >
            <td>{{ r.seq }}</td>
            <td>{{ r.lastName }}</td>
            <td>{{ r.firstName }}</td>
            <td>{{ r.rank }}</td>
            <td>{{ r.remark }}</td>
            <td style="text-align: right">✏️</td>
          </tr>
          <!-- Passenger rows -->
          <tr
            v-for="(r, i) in list.passengers"
            :key="'pax-' + i"
            style="border-top: 1px solid var(--border); cursor: pointer"
            @click="openEditRow('passenger', i)"
          >
            <td>{{ r.seq }}</td>
            <td>{{ r.lastName }}</td>
            <td>{{ r.firstName }}</td>
            <td>{{ r.rank }}</td>
            <td>{{ r.remark }}</td>
            <td style="text-align: right">✏️</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button class="danger" style="margin-top: 12px" @click="remove">Delete list</button>

    <!-- Edit row modal -->
    <Teleport to="body">
      <div v-if="editRow" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-sheet">
          <div class="row" style="justify-content: space-between; margin-bottom: 8px">
            <span class="badge">{{ editRow.rank }}</span>
            <button class="ghost" style="width: auto; min-height: 36px; padding: 0 12px" @click="closeEdit">✕</button>
          </div>

          <div v-for="f in editFields" :key="f.key">
            <label>{{ f.label }}</label>
            <input :value="getField(editRow, f.key)" @input="setField(editRow!, f.key, ($event.target as HTMLInputElement).value)" />
          </div>
          <div>
            <label>Remarks</label>
            <input v-model="editRow.remark" />
          </div>

          <button style="margin-top: 16px" :disabled="saving" @click="saveEdit">
            {{ saving ? 'Saving…' : 'Save & Rebuild' }}
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
