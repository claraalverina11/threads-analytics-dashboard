import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into their own chunks so the initial
        // app bundle stays small and caches independently of app code.
        // Rolldown (Vite's bundler) expects manualChunks as a function.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'charts'
            if (id.includes('react') || id.includes('scheduler')) return 'react'
            if (id.includes('date-fns')) return 'dates'
            return 'vendor'
          }
        },
      },
    },
  },
})
