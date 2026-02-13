import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      maxParallelFileOps: 5 // Lowered further to be extremely safe
    },
    commonjsOptions: {
      // Monaco is ESM; excluding it from CommonJS processing saves thousands of file scans
      exclude: [/node_modules\/monaco-editor/]
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
