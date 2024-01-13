import git from 'git-rev-sync'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
const VITE_GIT_HASH = JSON.stringify(git.long('.'))
const VITE_GIT_DATE = JSON.stringify(git.date())

console.log('VITE_GIT_HASH', VITE_GIT_HASH)
console.log('VITE_GIT_DATE', VITE_GIT_DATE)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    AutoImport({
      imports: [{ debug: [['default', 'Debug']] }],
      eslintrc: {
        enabled: true,
        globalsPropValue: 'readonly',
      },
    }),
    react(),
  ],
  define: {
    VITE_GIT_HASH,
    VITE_GIT_DATE,
  },
  test: {
    setupFiles: ['fake-indexeddb/auto'],
    testTimeout: 20000,
    reporters: 'tap-flat',
  },
})
