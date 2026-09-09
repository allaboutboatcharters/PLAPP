import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'boats', component: () => import('./views/BoatPicker.vue') },
  { path: '/boat/:id', name: 'boat-home', component: () => import('./views/BoatHome.vue'), props: true },
  { path: '/boat/:id/capture', name: 'capture', component: () => import('./views/CapturePassport.vue'), props: true },
  { path: '/boat/:id/new-list', name: 'new-list', component: () => import('./views/CreateList.vue'), props: true },
  { path: '/history', name: 'history', component: () => import('./views/History.vue') },
  { path: '/history/:listId', name: 'list-detail', component: () => import('./views/ListDetail.vue'), props: true },
  { path: '/history/:listId/add', name: 'add-passengers', component: () => import('./views/AddPassengers.vue'), props: true },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
})
