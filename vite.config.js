import git from 'git-rev-sync'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import AutoImport from 'unplugin-auto-import/vite'
const VITE_GIT_HASH = JSON.stringify(git.long('.'))
const VITE_GIT_DATE = JSON.stringify(git.date())

import process from 'process'
process.env.VITE_GIT_HASH = VITE_GIT_HASH
process.env.VITE_GIT_DATE = VITE_GIT_DATE

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    AutoImport({
      imports: [{ debug: [['default', 'Debug']] }],
    }),
    react(),
  ],
  test: {
    setupFiles: ['fake-indexeddb/auto'],
    testTimeout: 30000,
    reporters: 'tap-flat',
    isolate: false,
  },
})
