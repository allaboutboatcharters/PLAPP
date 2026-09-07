import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type PassportScan, type ExtractedPassport } from '../db/dexie'
import { SEVENTY_TWO_HOURS, isScanLive } from '../db/cleanup'

export const useScansStore = defineStore('scans', () => {
  const scans = ref<PassportScan[]>([])

  async function loadForBoat(boatId: number) {
    const all = await db.passportScans.where('boatId').equals(boatId).toArray()
    scans.value = all.sort((a, b) => b.capturedAt - a.capturedAt)
    return scans.value
  }

  /** Готовые, не истёкшие, не использованные сканы этой лодки. */
  async function candidatesForBoat(boatId: number, now = Date.now()) {
    const all = await db.passportScans.where('boatId').equals(boatId).toArray()
    return all
      .filter((s) => s.status === 'ready' && s.usedInListId == null && isScanLive(s.expiresAt, now))
      .sort((a, b) => a.capturedAt - b.capturedAt)
  }

  async function readyCount(boatId: number, now = Date.now()) {
    return (await candidatesForBoat(boatId, now)).length
  }

  async function createPending(boatId: number, imageBlob: Blob): Promise<number> {
    const capturedAt = Date.now()
    const id = await db.passportScans.add({
      boatId,
      capturedAt,
      expiresAt: capturedAt + SEVENTY_TWO_HOURS,
      imageBlob,
      status: 'pending',
      extracted: {
        lastName: '', firstName: '', dateOfBirth: '', placeOfBirth: '',
        nationality: '', issueDate: '', expirationDate: '', passportNumber: ''
      },
      remark: '',
      usedInListId: null
    })
    return id
  }

  async function setExtracted(id: number, extracted: ExtractedPassport) {
    await db.passportScans.update(id, { extracted, status: 'ready' })
  }

  async function setError(id: number, errorMsg: string) {
    await db.passportScans.update(id, { status: 'error', errorMsg })
  }

  async function update(id: number, patch: Partial<PassportScan>) {
    await db.passportScans.update(id, patch)
  }

  async function remove(id: number) {
    await db.passportScans.delete(id)
  }

  return {
    scans, loadForBoat, candidatesForBoat, readyCount,
    createPending, setExtracted, setError, update, remove
  }
})
