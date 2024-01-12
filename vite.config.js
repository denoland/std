import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    AutoImport({
      imports: [{ debug: [['default', 'Debug']] }],
      eslintrc: {
        enabled: true, // Default `false`
        globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },
    }),
    react(),
  ],
  test: {
    setupFiles: ['fake-indexeddb/auto'],
    testTimeout: 20000,
    reporters: 'tap-flat',
  },
})
