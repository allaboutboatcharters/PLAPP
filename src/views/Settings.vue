<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBoatsStore } from '../stores/boats'
import { useCrewStore } from '../stores/crew'
import BoatsTab from '../components/BoatsTab.vue'
import CrewTab from '../components/CrewTab.vue'
import ApiTab from '../components/ApiTab.vue'

const router = useRouter()
const boatsStore = useBoatsStore()
const crewStore = useCrewStore()

const tab = ref<'boats' | 'crew' | 'api'>('boats')

onMounted(async () => {
  await boatsStore.load()
  await crewStore.load()
})
</script>

<template>
  <div>
    <div class="topbar">
      <button class="back" @click="router.push('/')">‹ Back</button>
      <h1>Settings</h1>
      <span style="width: 60px"></span>
    </div>

    <div class="row" style="margin-bottom: 12px">
      <button :class="tab === 'boats' ? '' : 'ghost'" @click="tab = 'boats'">Boats</button>
      <button :class="tab === 'crew' ? '' : 'ghost'" @click="tab = 'crew'">Crew</button>
      <button :class="tab === 'api' ? '' : 'ghost'" @click="tab = 'api'">API Key</button>
    </div>

    <BoatsTab v-if="tab === 'boats'" />
    <CrewTab v-if="tab === 'crew'" />
    <ApiTab v-if="tab === 'api'" />
  </div>
</template>
