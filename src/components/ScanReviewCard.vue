<script setup lang="ts">
import type { ExtractedPassport } from '../db/dexie'

const model = defineModel<ExtractedPassport>({ required: true })
const remark = defineModel<string>('remark')
defineProps<{ showRemark?: boolean }>()

const fields: { key: keyof ExtractedPassport; label: string }[] = [
  { key: 'lastName', label: 'Last Name' },
  { key: 'firstName', label: 'First Name' },
  { key: 'dateOfBirth', label: 'Date of Birth (DD.MM.YYYY)' },
  { key: 'placeOfBirth', label: 'Place of Birth' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'issueDate', label: 'Issue Date (DD.MM.YYYY)' },
  { key: 'expirationDate', label: 'Expiration Date (DD.MM.YYYY)' },
  { key: 'passportNumber', label: 'Passport Number' }
]
</script>

<template>
  <div class="stack">
    <div v-for="f in fields" :key="String(f.key)">
      <label>{{ f.label }}</label>
      <input v-model="model[f.key]" />
    </div>
    <div v-if="showRemark">
      <label>Remarks (passenger accommodation)</label>
      <input v-model="remark" placeholder="e.g. Sonesta, Divi Resort" />
    </div>
  </div>
</template>
