import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type Boat } from '../db/dexie'

export const useBoatsStore = defineStore('boats', () => {
  const boats = ref<Boat[]>([])

  async function load() {
    const all = await db.boats.toArray()
    boats.value = all.sort((a, b) => a.sortOrder - b.sortOrder)
    return boats.value
  }

  async function add(name: string) {
    const sortOrder = (boats.value.at(-1)?.sortOrder ?? 0) + 1
    await db.boats.add({ name: name.trim(), sortOrder, active: true })
    await load()
  }

  async function update(id: number, patch: Partial<Boat>) {
    await db.boats.update(id, patch)
    await load()
  }

  async function remove(id: number) {
    await db.boats.delete(id)
    await load()
  }

  async function get(id: number) {
    return db.boats.get(id)
  }

  return { boats, load, add, update, remove, get }
})
