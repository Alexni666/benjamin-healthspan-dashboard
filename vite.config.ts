import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import { sites } from './build/sites-vite-plugin'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    sites(),
    cloudflare({
      config: {
        name: 'server',
        main: './worker/index.ts',
        compatibility_date: '2026-07-23',
        assets: { not_found_handling: 'single-page-application' },
      },
    }),
  ],
})
