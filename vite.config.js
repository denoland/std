import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['fake-indexeddb/auto'],
    testTimeout: 500,
    reporters: 'tap-flat',
  },
})
