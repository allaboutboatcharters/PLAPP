import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type Crew, type CrewRole } from '../db/dexie'

function emptyCrew(role: CrewRole, sortOrder: number): Crew {
  return {
    role,
    lastName: '', firstName: '', dateOfBirth: '', placeOfBirth: '',
    nationality: '', issueDate: '', expirationDate: '', passportNumber: '',
    remark: 'SXM', active: true, sortOrder
  }
}

export const useCrewStore = defineStore('crew', () => {
  const crew = ref<Crew[]>([])

  async function load() {
    const all = await db.crew.toArray()
    crew.value = all.sort((a, b) => a.sortOrder - b.sortOrder)
    return crew.value
  }

  async function add(role: CrewRole) {
    const sortOrder = (crew.value.at(-1)?.sortOrder ?? 0) + 1
    const id = await db.crew.add(emptyCrew(role, sortOrder))
    await load()
    return id
  }

  async function update(id: number, patch: Partial<Crew>) {
    await db.crew.update(id, patch)
    await load()
  }

  async function remove(id: number) {
    await db.crew.delete(id)
    await load()
  }

  function byRole(role: CrewRole) {
    return crew.value.filter((c) => c.role === role && c.active)
  }

  return { crew, load, add, update, remove, byRole }
})
