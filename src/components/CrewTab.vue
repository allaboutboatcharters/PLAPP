<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useCrewStore } from '../stores/crew'
import { compressImage } from '../lib/passportImage'
import { recognizePassport } from '../lib/claude'
import type { Crew, CrewRole, ExtractedPassport } from '../db/dexie'

const settingsStore = useSettingsStore()
const crewStore = useCrewStore()

/** Fields editable in the crew modal. Uses ExtractedPassport keys for type safety. */
const crewFields: { key: keyof ExtractedPassport; label: string }[] = [
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

async function addCrew(role: CrewRole): Promise<void> {
  const id = await crewStore.add(role)
  const added = crewStore.crew.find((c) => c.id === id)
  if (added) editingCrew.value = { ...added }
}

function openEdit(c: Crew): void {
  editingCrew.value = { ...c }
}

function confirmRemoveCrew(c: Crew): void {
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'this crew member'
  if (!confirm(`Delete ${name}?`)) return
  crewStore.remove(c.id!)
}

function closeEdit(): void {
  editingCrew.value = null
  fillError.value = ''
}

async function saveAndClose(): Promise<void> {
  const c = editingCrew.value
  if (!c || c.id == null) return
  const { id, ...patch } = c
  await crewStore.update(id, patch)
  editingCrew.value = null
}

const fillInput = ref<HTMLInputElement | null>(null)
const fillingId = ref<number | null>(null)
const fillError = ref('')

function fillByPhoto(): void {
  fillError.value = ''
  fillInput.value?.click()
}

async function onFillFile(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  const c = editingCrew.value
  if (!file || !c || c.id == null) return
  fillingId.value = c.id
  try {
    const s = await settingsStore.load()
    const { base64 } = await compressImage(file)
    const r = await recognizePassport([base64], { apiKey: s.apiKey, model: s.model })
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

/** Type-safe accessor for crew passport fields (replaces `as any` cast). */
function getField(c: Crew, key: keyof ExtractedPassport): string {
  return c[key]
}
function setField(c: Crew, key: keyof ExtractedPassport, value: string): void {
  ;(c as Record<keyof ExtractedPassport, string>)[key] = value
}
</script>

<template>
  <section>
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
        <button class="danger" style="width: auto; min-height: 40px; padding: 0 12px" @click.stop="confirmRemoveCrew(c)">✕</button>
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
        <button class="danger" style="width: auto; min-height: 40px; padding: 0 12px" @click.stop="confirmRemoveCrew(c)">✕</button>
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

          <div v-for="f in crewFields" :key="f.key">
            <label>{{ f.label }}</label>
            <input :value="getField(editingCrew, f.key)" @input="setField(editingCrew!, f.key, ($event.target as HTMLInputElement).value)" />
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
</template>
