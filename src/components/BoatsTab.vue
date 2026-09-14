<script setup lang="ts">
import { ref } from 'vue'
import { useBoatsStore } from '../stores/boats'

const boatsStore = useBoatsStore()
const newBoatName = ref('')

async function addBoat(): Promise<void> {
  if (!newBoatName.value.trim()) return
  await boatsStore.add(newBoatName.value)
  newBoatName.value = ''
}

function confirmRemoveBoat(id: number, name: string): void {
  if (!confirm(`Delete boat "${name}"?`)) return
  boatsStore.remove(id)
}
</script>

<template>
  <section>
    <div class="card">
      <label>New boat</label>
      <div class="row">
        <input v-model="newBoatName" placeholder="Boat name" @keyup.enter="addBoat" />
        <button style="width: auto" @click="addBoat">+</button>
      </div>
    </div>
    <div v-for="b in boatsStore.boats" :key="b.id" class="card row">
      <input :value="b.name" @change="(e) => boatsStore.update(b.id!, { name: (e.target as HTMLInputElement).value })" />
      <button class="danger" style="width: auto" @click="confirmRemoveBoat(b.id!, b.name)">✕</button>
    </div>
  </section>
</template>
