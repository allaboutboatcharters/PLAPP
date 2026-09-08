<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBoatsStore } from '../stores/boats'
import { useScansStore } from '../stores/scans'
import { useSettingsStore } from '../stores/settings'
import { compressImage } from '../lib/passportImage'
import { recognizePassport } from '../lib/claude'
import type { ExtractedPassport } from '../db/dexie'
import ScanReviewCard from '../components/ScanReviewCard.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const boatsStore = useBoatsStore()
const scansStore = useScansStore()
const settingsStore = useSettingsStore()

type Phase = 'idle' | 'recognizing' | 'review' | 'error'
const phase = ref<Phase>('idle')
const boatName = ref('')
const errorMsg = ref('')
const flags = ref('')
const savedCount = ref(0)

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref('')
let compressedBlob: Blob | null = null
let scanId: number | null = null

const extracted = ref<ExtractedPassport>(blankExtracted())
const remark = ref('')

function blankExtracted(): ExtractedPassport {
  return {
    lastName: '', firstName: '', dateOfBirth: '', placeOfBirth: '',
    nationality: '', issueDate: '', expirationDate: '', passportNumber: ''
  }
}

onMounted(async () => {
  const boat = await boatsStore.get(Number(props.id))
  boatName.value = boat?.name ?? 'Лодка'
})

function pick() {
  fileInput.value?.click()
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  errorMsg.value = ''
  flags.value = ''
  phase.value = 'recognizing'
  try {
    const s = await settingsStore.load()
    const { blob, base64 } = await compressImage(file)
    compressedBlob = blob
    previewUrl.value = URL.createObjectURL(blob)
    const result = await recognizePassport([base64], { apiKey: s.apiKey, model: s.model })
    extracted.value = {
      lastName: result.lastName, firstName: result.firstName,
      dateOfBirth: result.dateOfBirth, placeOfBirth: result.placeOfBirth,
      nationality: result.nationality, issueDate: result.issueDate,
      expirationDate: result.expirationDate, passportNumber: result.passportNumber
    }
    flags.value = result.confidenceFlags && result.confidenceFlags !== 'нет' ? result.confidenceFlags : ''
    phase.value = 'review'
  } catch (err) {
    errorMsg.value = (err as Error).message
    phase.value = 'error'
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function save() {
  if (!compressedBlob) return
  scanId = await scansStore.createPending(Number(props.id), compressedBlob)
  await scansStore.setExtracted(scanId, extracted.value)
  await scansStore.update(scanId, { remark: remark.value })
  savedCount.value++
  reset()
}

function reset() {
  phase.value = 'idle'
  extracted.value = blankExtracted()
  remark.value = ''
  flags.value = ''
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  compressedBlob = null
  scanId = null
}
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push(`/boat/${id}`)">‹ {{ boatName }}</button>
      <h1>Паспорт</h1>
      <span style="width: 60px"></span>
    </div>

    <p v-if="savedCount" class="badge">Сохранено сканов: {{ savedCount }}</p>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="onFile"
    />

    <!-- IDLE -->
    <div v-if="phase === 'idle'" class="stack">
      <button @click="pick">📷 Сфотографировать паспорт</button>
      <button v-if="savedCount" class="secondary" @click="router.push(`/boat/${id}`)">Готово</button>
    </div>

    <!-- RECOGNIZING -->
    <div v-else-if="phase === 'recognizing'" class="card center">
      <p>Распознаю паспорт…</p>
      <img v-if="previewUrl" :src="previewUrl" style="max-width: 100%; border-radius: 10px" />
    </div>

    <!-- REVIEW -->
    <div v-else-if="phase === 'review'" class="stack">
      <img v-if="previewUrl" :src="previewUrl" style="max-width: 100%; border-radius: 10px" />
      <div v-if="flags" class="card" style="border-color: var(--danger)">
        ⚠️ Требует проверки: {{ flags }}
      </div>
      <div class="card">
        <ScanReviewCard v-model="extracted" v-model:remark="remark" :show-remark="true" />
      </div>
      <button @click="save">Сохранить скан</button>
      <button class="ghost" @click="reset">Отмена</button>
    </div>

    <!-- ERROR -->
    <div v-else-if="phase === 'error'" class="stack">
      <div class="card" style="border-color: var(--danger)">
        <b>Ошибка распознавания</b>
        <p class="muted">{{ errorMsg }}</p>
      </div>
      <button class="secondary" @click="pick">Попробовать снова</button>
      <button class="ghost" @click="reset">Отмена</button>
    </div>
  </div>
</template>
