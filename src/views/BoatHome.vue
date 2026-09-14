<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBoatsStore } from '../stores/boats'
import { useScansStore } from '../stores/scans'
import ScanReviewCard from '../components/ScanReviewCard.vue'
import type { PassportScan, ExtractedPassport } from '../db/dexie'

const props = defineProps<{ id: string }>()
const router = useRouter()
const boatsStore = useBoatsStore()
const scansStore = useScansStore()

const boatName = ref('')
const readyCount = ref(0)
const loading = ref(true)
const scans = ref<PassportScan[]>([])
const showScans = ref(false)

// Edit scan modal
const editingScan = ref<PassportScan | null>(null)
const editExtracted = ref<ExtractedPassport>({
  lastName: '', firstName: '', dateOfBirth: '', placeOfBirth: '',
  nationality: '', issueDate: '', expirationDate: '', passportNumber: ''
})
const editRemark = ref('')

onMounted(async () => {
  const boatId = Number(props.id)
  const boat = await boatsStore.get(boatId)
  boatName.value = boat?.name ?? 'Boat'
  await refreshScans()
  loading.value = false
})

async function refreshScans(): Promise<void> {
  const candidates = await scansStore.candidatesForBoat(Number(props.id))
  scans.value = candidates
  readyCount.value = candidates.length
}

function openEditScan(s: PassportScan): void {
  editingScan.value = s
  editExtracted.value = { ...s.extracted }
  editRemark.value = s.remark
}

function closeEditScan(): void {
  editingScan.value = null
}

async function saveEditScan(): Promise<void> {
  const s = editingScan.value
  if (!s || s.id == null) return
  await scansStore.setExtracted(s.id, { ...editExtracted.value })
  await scansStore.update(s.id, { remark: editRemark.value })
  await refreshScans()
  editingScan.value = null
}

async function deleteScan(s: PassportScan): Promise<void> {
  const name = [s.extracted.lastName, s.extracted.firstName].filter(Boolean).join(' ') || 'this scan'
  if (!confirm(`Delete scan for ${name}?`)) return
  await scansStore.remove(s.id!)
  await refreshScans()
  if (editingScan.value?.id === s.id) editingScan.value = null
}
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push('/')">‹ Boats</button>
      <h1>{{ boatName }}</h1>
      <span style="width: 60px"></span>
    </div>

    <div v-if="loading" class="card center muted">Loading…</div>

    <template v-else>
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

      <!-- Scan list toggle -->
      <button
        v-if="scans.length"
        class="ghost"
        style="margin-top: 8px"
        @click="showScans = !showScans"
      >
        {{ showScans ? 'Hide scans ▲' : 'View / Edit scans ▼' }}
      </button>

      <div v-if="showScans && scans.length" class="stack" style="margin-top: 8px">
        <div
          v-for="s in scans"
          :key="s.id"
          class="card row"
          style="justify-content: space-between; cursor: pointer"
          @click="openEditScan(s)"
        >
          <div>
            <b>{{ s.extracted.lastName || '—' }} {{ s.extracted.firstName || '' }}</b>
            <div class="muted" style="font-size: 0.82rem">
              {{ s.extracted.passportNumber || 'No passport' }} · {{ s.remark || '—' }}
            </div>
          </div>
          <div class="row" style="gap: 6px; flex-shrink: 0">
            <button class="ghost" style="width: auto; min-height: 40px; padding: 0 12px" @click.stop="openEditScan(s)">✏️</button>
            <button class="danger" style="width: auto; min-height: 40px; padding: 0 12px" @click.stop="deleteScan(s)">✕</button>
          </div>
        </div>
      </div>

      <!-- Edit scan modal -->
      <Teleport to="body">
        <div v-if="editingScan" class="modal-overlay" @click.self="closeEditScan">
          <div class="modal-sheet">
            <div class="row" style="justify-content: space-between; margin-bottom: 8px">
              <span class="badge">EDIT SCAN</span>
              <button class="ghost" style="width: auto; min-height: 36px; padding: 0 12px" @click="closeEditScan">✕</button>
            </div>

            <ScanReviewCard v-model="editExtracted" v-model:remark="editRemark" :show-remark="true" />

            <div class="row" style="margin-top: 16px">
              <button @click="saveEditScan">Save</button>
              <button class="danger" style="width: auto" @click="deleteScan(editingScan!)">Delete</button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>
