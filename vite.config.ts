import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Brain — jeux de magazine',
        short_name: 'Brain',
        description: 'Sudoku, mots fléchés, mots croisés et compagnie.',
        lang: 'fr',
        theme_color: '#f6f1e7',
        background_color: '#f6f1e7',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
})
