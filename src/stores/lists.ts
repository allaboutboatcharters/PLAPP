import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type PassengerList } from '../db/dexie'

export const useListsStore = defineStore('lists', () => {
  const lists = ref<PassengerList[]>([])

  async function loadAll() {
    const all = await db.passengerLists.toArray()
    lists.value = all.sort((a, b) => b.createdAt - a.createdAt)
    return lists.value
  }

  async function get(id: number) {
    return db.passengerLists.get(id)
  }

  async function save(list: PassengerList): Promise<number> {
    const id = await db.passengerLists.add(list)
    await loadAll()
    return id
  }

  async function remove(id: number) {
    await db.passengerLists.delete(id)
    await loadAll()
  }

  /** Номера паспортов, уже использованные в списках этой лодки за указанную дату. */
  async function usedPassportNumbers(boatId: number, date: string): Promise<Set<string>> {
    const all = await db.passengerLists.where('boatId').equals(boatId).toArray()
    const set = new Set<string>()
    for (const l of all) {
      if (l.date !== date) continue
      for (const p of l.passengers) {
        if (p.passportNumber) set.add(p.passportNumber.trim())
      }
    }
    return set
  }

  return { lists, loadAll, get, save, remove, usedPassportNumbers }
})
