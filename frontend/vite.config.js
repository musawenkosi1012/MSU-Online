import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      maxParallelFileOps: 20 // Limit parallel file operations to prevent EMFILE error
    }
  },
  server: {
    port: process.env.PORT || 5173,
    strictPort: false,
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
