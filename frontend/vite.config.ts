import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: {
      key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.key')),
      cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.crt')),
    },
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  }
})
