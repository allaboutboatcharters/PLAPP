import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

const useSsl = process.env.VITE_SSL === '1' || process.argv.includes('--host')

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/PLAPP/' : './',
  plugins: [
    vue(),
    ...(useSsl ? [basicSsl()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Crew & Passenger List',
        short_name: 'PLAPP',
        description: 'Crew and Passenger List generator for All About Boat Charters',
        theme_color: '#0b3d5c',
        background_color: '#0b3d5c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ]
})
