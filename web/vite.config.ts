import { defineConfig } from 'vite'

const proxy = { '/api': 'http://127.0.0.1:8765' }

export default defineConfig({
  base: './',
  server: { proxy },
  preview: { proxy },
})
