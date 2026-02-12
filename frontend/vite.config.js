import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: process.env.PORT || 5173,
    strictPort: true,
    hmr: {
      overlay: false
    },
    host: true,
    allowedHosts: [
      'light-parents-open.loca.lt',
      'bb2a85b601e3eb20-197-221-232-183.serveousercontent.com'
    ]
  }
})
