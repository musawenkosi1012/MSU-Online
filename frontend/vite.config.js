import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    // Increase chunk size limit since we are using a premium UI with many components
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      external: ['monaco-editor'],
      maxParallelFileOps: 1, // Be as conservative as possible
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react']
        }
      }
    },
    commonjsOptions: {
      exclude: [/node_modules\/monaco-editor/, /monaco-editor/]
    }
  },
  optimizeDeps: {
    exclude: ['monaco-editor']
  },
  resolve: {
    alias: {
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
