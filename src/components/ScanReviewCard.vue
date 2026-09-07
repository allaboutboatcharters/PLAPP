<script setup lang="ts">
import type { ExtractedPassport } from '../db/dexie'

const model = defineModel<ExtractedPassport>({ required: true })
const remark = defineModel<string>('remark')
defineProps<{ showRemark?: boolean }>()

const fields: { key: keyof ExtractedPassport; label: string }[] = [
  { key: 'lastName', label: 'Фамилия (Last Name)' },
  { key: 'firstName', label: 'Имя (First Name)' },
  { key: 'dateOfBirth', label: 'Дата рождения (ДД.ММ.ГГГГ)' },
  { key: 'placeOfBirth', label: 'Место рождения' },
  { key: 'nationality', label: 'Гражданство' },
  { key: 'issueDate', label: 'Дата выдачи (ДД.ММ.ГГГГ)' },
  { key: 'expirationDate', label: 'Действителен до (ДД.ММ.ГГГГ)' },
  { key: 'passportNumber', label: 'Номер паспорта' }
]
</script>

<template>
  <div class="stack">
    <div v-for="f in fields" :key="String(f.key)">
      <label>{{ f.label }}</label>
      <input v-model="model[f.key]" />
    </div>
    <div v-if="showRemark">
      <label>Remarks (жильё пассажира)</label>
      <input v-model="remark" placeholder="напр. Sonesta, Divi Resort" />
    </div>
  </div>
</template>
