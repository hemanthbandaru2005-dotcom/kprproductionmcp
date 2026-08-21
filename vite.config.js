import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { driveApiPlugin } from './server/driveApiPlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    driveApiPlugin(),
  ],
  server: {
    allowedHosts: true, // Allows all public tunnel hosts (trycloudflare, localtunnel, etc.)
    host: true,
    port: 5174
  }
})
