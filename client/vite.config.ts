import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // generates 'manifest.webmanifest' file on build
      manifest: {
        // caches the assets/icons mentioned (assets/* includes all the assets present in your src/ directory) 

        name: 'Trade Sentinel',
        short_name: 'Trade Sentinel',
        start_url: '/',
        background_color: '#EEF2F6',
        theme_color: '#EEF2F6',
        icons: [
          {
            src: '/sentinel_logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/sentinel_logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // defining cached files formats
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      }
    })
  ],
})
