
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://api-gateway:3000', 
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  //proxy для preview mode (чтобы работало в контейнере)
  preview: {
    port: 5173,  // Использует 5173 из docker-compose (перезапись 4173 из config)
    host: '0.0.0.0',
    proxy: {  
      '/api': {
        target: 'http://api-gateway:3000', 
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})