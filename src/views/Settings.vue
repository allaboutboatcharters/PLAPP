<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settings'
import { useBoatsStore } from '../stores/boats'
import { useCrewStore } from '../stores/crew'
import { compressImage } from '../lib/passportImage'
import { recognizePassport } from '../lib/claude'
import type { Crew, CrewRole } from '../db/dexie'

const router = useRouter()
const settingsStore = useSettingsStore()
const boatsStore = useBoatsStore()
const crewStore = useCrewStore()

const tab = ref<'boats' | 'crew' | 'api'>('boats')

// --- boats ---
const newBoatName = ref('')
async function addBoat() {
  if (!newBoatName.value.trim()) return
  await boatsStore.add(newBoatName.value)
  newBoatName.value = ''
}

// --- crew ---
const crewFields: { key: keyof Crew; label: string }[] = [
  { key: 'lastName', label: 'Last Name' },
  { key: 'firstName', label: 'First Name' },
  { key: 'dateOfBirth', label: 'Date of Birth (DD.MM.YYYY)' },
  { key: 'placeOfBirth', label: 'Place of Birth' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'issueDate', label: 'Issue Date (DD.MM.YYYY)' },
  { key: 'expirationDate', label: 'Expiration Date (DD.MM.YYYY)' },
  { key: 'passportNumber', label: 'Passport Number' }
]

// Modal state for editing crew member
const editingCrew = ref<Crew | null>(null)

async function addCrew(role: CrewRole) {
  const id = await crewStore.add(role)
  // Open the new crew member in the modal right away
  const added = crewStore.crew.find((c) => c.id === id)
  if (added) editingCrew.value = { ...added }
}

function openEdit(c: Crew) {
  editingCrew.value = { ...c }
}

function closeEdit() {
  editingCrew.value = null
  fillError.value = ''
}

async function saveAndClose() {
  const c = editingCrew.value
  if (!c || c.id == null) return
  const { id, ...patch } = c
  await crewStore.update(id, patch)
  editingCrew.value = null
}

const fillInput = ref<HTMLInputElement | null>(null)
const fillingId = ref<number | null>(null)
const fillError = ref('')

function fillByPhoto() {
  fillError.value = ''
  fillInput.value?.click()
}

async function onFillFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  const c = editingCrew.value
  if (!file || !c || c.id == null) return
  fillingId.value = c.id
  try {
    const s = await settingsStore.load()
    const { base64 } = await compressImage(file)
    const r = await recognizePassport([base64], { apiKey: s.apiKey, model: s.model })
    // Update both the DB and the modal form
    const patch = {
      lastName: r.lastName, firstName: r.firstName, dateOfBirth: r.dateOfBirth,
      placeOfBirth: r.placeOfBirth, nationality: r.nationality,
      issueDate: r.issueDate, expirationDate: r.expirationDate, passportNumber: r.passportNumber
    }
    await crewStore.update(c.id, patch)
    Object.assign(editingCrew.value!, patch)
  } catch (err) {
    fillError.value = (err as Error).message
  } finally {
    fillingId.value = null
    if (fillInput.value) fillInput.value.value = ''
  }
}

// --- api ---
const apiKey = ref('')
const model = ref('claude-sonnet-5')
async function saveApi() {
  await settingsStore.update({ apiKey: apiKey.value.trim(), model: model.value.trim() })
}

onMounted(async () => {
  const s = await settingsStore.load()
  apiKey.value = s.apiKey
  model.value = s.model
  await boatsStore.load()
  await crewStore.load()
})
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push('/')">‹ Back</button>
      <h1>Settings</h1>
      <span style="width: 60px"></span>
    </div>

    <div class="row" style="margin-bottom: 12px">
      <button :class="tab === 'boats' ? '' : 'ghost'" @click="tab = 'boats'">Boats</button>
      <button :class="tab === 'crew' ? '' : 'ghost'" @click="tab = 'crew'">Crew</button>
      <button :class="tab === 'api' ? '' : 'ghost'" @click="tab = 'api'">API Key</button>
    </div>

    <!-- BOATS -->
    <section v-if="tab === 'boats'">
      <div class="card">
        <label>New boat</label>
        <div class="row">
          <input v-model="newBoatName" placeholder="Boat name" @keyup.enter="addBoat" />
          <button style="width: auto" @click="addBoat">+</button>
        </div>
      </div>
      <div v-for="b in boatsStore.boats" :key="b.id" class="card row">
        <input :value="b.name" @change="(e) => boatsStore.update(b.id!, { name: (e.target as HTMLInputElement).value })" />
        <button class="danger" style="width: auto" @click="boatsStore.remove(b.id!)">✕</button>
      </div>
    </section>

    <!-- CREW -->
    <section v-if="tab === 'crew'">
      <input
        ref="fillInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onFillFile"
      />
      <div class="row">
        <button class="secondary" @click="addCrew('captain')">+ Captain</button>
        <button class="secondary" @click="addCrew('assistant')">+ Assistant</button>
      </div>

      <!-- Captains list -->
      <h3 v-if="crewStore.crew.filter(c => c.role === 'captain').length">Captains</h3>
      <div
        v-for="c in crewStore.crew.filter(c => c.role === 'captain')"
        :key="c.id"
        class="card row"
        style="justify-content: space-between; cursor: pointer"
        @click="openEdit(c)"
      >
        <div>
          <b>{{ c.lastName || '—' }} {{ c.firstName || '' }}</b>
          <div class="muted" style="font-size: 0.82rem">{{ c.passportNumber || 'No passport' }}</div>
        </div>
        <div class="row" style="gap: 6px; flex-shrink: 0">
          <button class="ghost" style="width: auto; min-height: 40px; padding: 0 12px" @click.stop="openEdit(c)">✏️</button>
          <button class="danger" style="width: auto; min-height: 40px; padding: 0 12px" @click.stop="crewStore.remove(c.id!)">✕</button>
        </div>
      </div>

      <!-- Assistants list -->
      <h3 v-if="crewStore.crew.filter(c => c.role === 'assistant').length">Assistants</h3>
      <div
        v-for="c in crewStore.crew.filter(c => c.role === 'assistant')"
        :key="c.id"
        class="card row"
        style="justify-content: space-between; cursor: pointer"
        @click="openEdit(c)"
      >
        <div>
          <b>{{ c.lastName || '—' }} {{ c.firstName || '' }}</b>
          <div class="muted" style="font-size: 0.82rem">{{ c.passportNumber || 'No passport' }}</div>
        </div>
        <div class="row" style="gap: 6px; flex-shrink: 0">
          <button class="ghost" style="width: auto; min-height: 40px; padding: 0 12px" @click.stop="openEdit(c)">✏️</button>
          <button class="danger" style="width: auto; min-height: 40px; padding: 0 12px" @click.stop="crewStore.remove(c.id!)">✕</button>
        </div>
      </div>

      <!-- Edit modal (overlay) -->
      <Teleport to="body">
        <div v-if="editingCrew" class="modal-overlay" @click.self="closeEdit">
          <div class="modal-sheet">
            <div class="row" style="justify-content: space-between; margin-bottom: 8px">
              <span class="badge">{{ editingCrew.role === 'captain' ? 'CAPTAIN' : 'CREW' }}</span>
              <button class="ghost" style="width: auto; min-height: 36px; padding: 0 12px" @click="closeEdit">✕</button>
            </div>

            <div v-if="fillError" class="card" style="border-color: var(--danger); margin: 0 0 8px">{{ fillError }}</div>

            <button class="ghost" style="margin-bottom: 8px" :disabled="fillingId === editingCrew.id" @click="fillByPhoto">
              {{ fillingId === editingCrew.id ? 'Recognizing…' : '📷 Fill from passport photo' }}
            </button>

            <div v-for="f in crewFields" :key="String(f.key)">
              <label>{{ f.label }}</label>
              <input v-model="(editingCrew as any)[f.key]" />
            </div>
            <div>
              <label>Remarks (default SXM)</label>
              <input v-model="editingCrew.remark" />
            </div>

            <button style="margin-top: 16px" @click="saveAndClose">Save</button>
          </div>
        </div>
      </Teleport>
    </section>

    <!-- API -->
    <section v-if="tab === 'api'">
      <div class="card stack">
        <div>
          <label>Anthropic API key</label>
          <input v-model="apiKey" type="password" placeholder="sk-ant-..." autocomplete="off" />
        </div>
        <div>
          <label>Model</label>
          <input v-model="model" />
        </div>
        <button @click="saveApi">Save</button>
        <p class="muted" style="font-size: 0.8rem">
          Key is stored only on this device (IndexedDB) and used for direct requests to api.anthropic.com.
        </p>
      </div>
    </section>
  </div>
</template>
