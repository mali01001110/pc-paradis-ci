import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5182,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
            if (id.includes('lucide-react')) return 'vendor-lucide'
            if (id.includes('@tanstack/react-query')) return 'vendor-query'
            if (id.includes('axios')) return 'vendor-axios'
            if (id.includes('embla-carousel-react')) return 'vendor-embla'
            return 'vendor'
          }
          return undefined
        },
      },
    },
  },
})
