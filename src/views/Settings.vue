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
  { key: 'lastName', label: 'Фамилия' },
  { key: 'firstName', label: 'Имя' },
  { key: 'dateOfBirth', label: 'Дата рождения (ДД.ММ.ГГГГ)' },
  { key: 'placeOfBirth', label: 'Место рождения' },
  { key: 'nationality', label: 'Гражданство' },
  { key: 'issueDate', label: 'Дата выдачи (ДД.ММ.ГГГГ)' },
  { key: 'expirationDate', label: 'Действителен до (ДД.ММ.ГГГГ)' },
  { key: 'passportNumber', label: 'Номер паспорта' }
]

async function addCrew(role: CrewRole) {
  await crewStore.add(role)
}
async function saveCrew(c: Crew) {
  if (c.id == null) return
  const { id, ...patch } = c
  await crewStore.update(id, patch)
}

const fillInput = ref<HTMLInputElement | null>(null)
const fillingId = ref<number | null>(null)
const fillError = ref('')
let pendingCrewId: number | null = null

function fillByPhoto(c: Crew) {
  pendingCrewId = c.id ?? null
  fillError.value = ''
  fillInput.value?.click()
}

async function onFillFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  const id = pendingCrewId
  if (!file || id == null) return
  fillingId.value = id
  try {
    const s = await settingsStore.load()
    const { base64 } = await compressImage(file)
    const r = await recognizePassport([base64], { apiKey: s.apiKey, model: s.model })
    await crewStore.update(id, {
      lastName: r.lastName, firstName: r.firstName, dateOfBirth: r.dateOfBirth,
      placeOfBirth: r.placeOfBirth, nationality: r.nationality,
      issueDate: r.issueDate, expirationDate: r.expirationDate, passportNumber: r.passportNumber
    })
  } catch (err) {
    fillError.value = (err as Error).message
  } finally {
    fillingId.value = null
    pendingCrewId = null
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
      <button class="back" @click="router.push('/')">‹ Назад</button>
      <h1>Настройки</h1>
      <span style="width: 60px"></span>
    </div>

    <div class="row" style="margin-bottom: 12px">
      <button :class="tab === 'boats' ? '' : 'ghost'" @click="tab = 'boats'">Лодки</button>
      <button :class="tab === 'crew' ? '' : 'ghost'" @click="tab = 'crew'">Экипаж</button>
      <button :class="tab === 'api' ? '' : 'ghost'" @click="tab = 'api'">API-ключ</button>
    </div>

    <!-- BOATS -->
    <section v-if="tab === 'boats'">
      <div class="card">
        <label>Новая лодка</label>
        <div class="row">
          <input v-model="newBoatName" placeholder="Название лодки" @keyup.enter="addBoat" />
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
        <button class="secondary" @click="addCrew('captain')">+ Капитан</button>
        <button class="secondary" @click="addCrew('assistant')">+ Помощник</button>
      </div>
      <div v-if="fillError" class="card" style="border-color: var(--danger)">{{ fillError }}</div>
      <div v-for="c in crewStore.crew" :key="c.id" class="card stack">
        <div class="row" style="justify-content: space-between">
          <span class="badge">{{ c.role === 'captain' ? 'CAPTAIN' : 'CREW' }}</span>
          <button class="danger" style="width: auto" @click="crewStore.remove(c.id!)">✕</button>
        </div>
        <button class="ghost" :disabled="fillingId === c.id" @click="fillByPhoto(c)">
          {{ fillingId === c.id ? 'Распознаю…' : '📷 Заполнить по фото паспорта' }}
        </button>
        <div v-for="f in crewFields" :key="String(f.key)">
          <label>{{ f.label }}</label>
          <input v-model="(c as any)[f.key]" @change="saveCrew(c)" />
        </div>
        <div>
          <label>Remarks (по умолчанию SXM)</label>
          <input v-model="c.remark" @change="saveCrew(c)" />
        </div>
      </div>
    </section>

    <!-- API -->
    <section v-if="tab === 'api'">
      <div class="card stack">
        <div>
          <label>Anthropic API key</label>
          <input v-model="apiKey" type="password" placeholder="sk-ant-..." autocomplete="off" />
        </div>
        <div>
          <label>Модель</label>
          <input v-model="model" />
        </div>
        <button @click="saveApi">Сохранить</button>
        <p class="muted" style="font-size: 0.8rem">
          Ключ хранится только на этом устройстве (IndexedDB) и используется для
          прямых запросов к api.anthropic.com.
        </p>
      </div>
    </section>
  </div>
</template>
